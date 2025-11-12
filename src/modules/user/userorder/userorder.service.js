import prisma from "../../../prisma/client.js";
import { ServerException, ClientException } from "../../../utils/errors.js";

/**
 * UserOrderService: xử lý logic nghiệp vụ liên quan tới đơn hàng của user
 * - Tạo đơn hàng: kiểm tra giỏ hàng, stock, áp dụng voucher, tạo transaction
 * - Lấy chi tiết / danh sách đơn hàng
 * - Hủy đơn hàng: hoàn stock, hoàn voucher
 * - Thống kê đơn hàng của user
 */
export class userOrderService {
    
    /**
     * Tạo số đơn hàng unique theo format: ORD + 6 ký tự từ timestamp + 3 ký tự random
     * Ví dụ: ORD123456XYZ
     * Dùng để dễ dàng theo dõi và tìm kiếm đơn hàng
     */
    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `ORD${timestamp}${random}`;
    }
    
    /**
     * Tạo đơn hàng mới từ giỏ hàng của user
     * 
     * Params:
     *   userId: ID của user
     *   data: {
     *     addressId: ID địa chỉ giao hàng (bắt buộc)
     *     paymentMethodId: ID phương thức thanh toán (bắt buộc)
     *     voucherCode?: mã voucher (tùy chọn)
     *     note?: ghi chú đơn hàng
     *   }
     * 
     * Flow:
     * 1. Kiểm tra địa chỉ và phương thức thanh toán hợp lệ
     * 2. Lấy giỏ hàng, kiểm tra không rỗng
     * 3. Tính tổng tiền từ giỏ hàng (kiểm tra stock)
     * 4. Nếu có voucher: validate voucher, tính discount
     * 5. Tạo transaction để:
     *    - Tạo order record
     *    - Tạo orderDetail cho mỗi item trong giỏ
     *    - Giảm stock sản phẩm
     *    - Tăng usage count voucher (nếu có)
     *    - Xóa giỏ hàng
     *    - Log lịch sử đơn hàng
     * 6. Trả về đối tượng order đầy đủ
     */
    async create(userId, data) {
        // Kiểm tra địa chỉ
        const address = await prisma.address.findFirst({
            where: { id: data.addressId, userId: userId }
        });
        if (!address) throw new ClientException("Địa chỉ không hợp lệ", 404);
        
        // Kiểm tra phương thức thanh toán
        const paymentMethod = await prisma.paymentMethod.findFirst({
            where: { id: data.paymentMethodId, isActive: true }
        });
        if (!paymentMethod) throw new ClientException("Phương thức thanh toán không hợp lệ", 404);
        
        // Lấy giỏ hàng của user
        const cart = await prisma.cart.findUnique({
            where: { userId: userId },
            include: {
                cartDetails: {
                    include: {
                        productVariant: true
                    }
                }
            }
        });
        
        // Giỏ hàng không được rỗng
        if (!cart || cart.cartDetails.length === 0) {
            throw new ClientException("Giỏ hàng trống", 400);
        }
        
        // Tính subtotal từ giỏ hàng, kiểm tra stock
        let subtotal = 0;
        
        for (const item of cart.cartDetails) {
            const variant = item.productVariant;
            if (!variant) throw new ClientException("Sản phẩm không tồn tại", 404);
            
            if (variant.stockQuantity < item.quantity) {
                throw new ClientException("Sản phẩm không đủ hàng", 400);
            }
            
            const price = variant.variantPrice || 0;
            subtotal += price * item.quantity;
        }
        
        // Xử lý voucher (nếu có)
        let voucherDiscount = 0;
        let voucherId = null;
        
        if (data.voucherCode) {
            const voucher = await prisma.voucher.findFirst({
                where: {
                    code: data.voucherCode,
                    isActive: true,
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() }
                }
            });
            
            // Kiểm tra voucher hợp lệ: còn trong thời hạn, có lượt sử dụng, đơn hàng đủ điều kiện
            if (voucher && subtotal >= voucher.minOrderValue && voucher.currentUsage < voucher.maxUsage) {
                voucherId = voucher.id;
                
                // Tính discount: phần trăm hoặc cố định
                if (voucher.discountType === "PERCENTAGE") {
                    voucherDiscount = (subtotal * voucher.discountValue) / 100;
                } else {
                    voucherDiscount = voucher.discountValue;
                }
                
                // Đảm bảo discount không vượt quá subtotal
                if (voucherDiscount > subtotal) voucherDiscount = subtotal;
            }
        }
        
        const total = subtotal - voucherDiscount;
        
        // Tạo order bằng transaction để đảm bảo tính nhất quán dữ liệu
        const order = await prisma.$transaction(async (tx) => {
            // 1. Tạo order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: this.generateOrderNumber(),
                    userId: userId,
                    addressId: data.addressId,
                    paymentMethodId: data.paymentMethodId,
                    status: "PENDING",
                    paymentStatus: "PENDING",
                    subtotal: subtotal,
                    voucherId: voucherId,
                    voucherDiscount: voucherDiscount,
                    total: total,
                    note: data.note
                }
            });
            
            // 2. Tạo orderDetail cho mỗi item, giảm stock
            for (const item of cart.cartDetails) {
                const variant = item.productVariant;
                const variantName = `${variant.size} - ${variant.color}`;
                
                await tx.orderDetail.create({
                    data: {
                        orderId: newOrder.id,
                        productId: variant.productId,
                        productVariantId: variant.id,
                        productName: "",
                        productImage: variant.variantImageUrl || "",
                        variantName: variantName,
                        price: variant.variantPrice || 0,
                        quantity: item.quantity,
                        subtotal: (variant.variantPrice || 0) * item.quantity
                    }
                });
                
                // Giảm stock
                await tx.productVariant.update({
                    where: { id: variant.id },
                    data: { stockQuantity: { decrement: item.quantity } }
                });
            }
            
            // 3. Tăng usage count voucher
            if (voucherId) {
                await tx.voucher.update({
                    where: { id: voucherId },
                    data: { currentUsage: { increment: 1 } }
                });
            }
            
            // 4. Xóa giỏ hàng
            await tx.cartDetail.deleteMany({
                where: { cartId: cart.id }
            });
            
            // 5. Log lịch sử đơn hàng
            await tx.orderLog.create({
                data: {
                    orderId: newOrder.id,
                    userId: userId,
                    newStatus: "PENDING",
                    reason: "Tạo đơn hàng mới"
                }
            });
            
            return newOrder;
        });
        
        return await this.getOrderDetails(order.id, userId);
    }
    
    /**
     * Lấy chi tiết một đơn hàng (với tất cả thông tin liên quan)
     * 
     * Params:
     *   orderId: ID đơn hàng
     *   userId: ID user (để bảo mật: chỉ user chủ nhân được xem)
     * 
     * Return: {
     *   id, orderNumber, status, total, subtotal, ...,
     *   user: { id, userName, email, phoneNumber },
     *   address: { ...thông tin địa chỉ... },
     *   paymentMethod: { ...thông tin thanh toán... },
     *   voucher: { ...thông tin voucher nếu có... },
     *   orderDetails: [ { productVariantId, quantity, price, ... }, ... ]
     * }
     */
    async getOrderDetails(orderId, userId) {
        const order = await prisma.order.findFirst({
            where: { 
                id: orderId,
                userId: userId  // Chỉ user sở hữu đơn hàng mới được xem
            },
            include: {
                user: {
                    select: {
                        id: true,
                        userName: true,
                        email: true,
                        phoneNumber: true
                    }
                },
                address: true,
                paymentMethod: true,
                voucher: true,
                orderDetails: true
            }
        });
        
        if (!order) throw new ServerException("Đơn hàng không tồn tại", 404);
        return order;
    }
    
    /**
     * Lấy danh sách đơn hàng của user (có pagination, filter, search)
     * 
     * Params:
     *   userId: ID user
     *   query: {
     *     limit: số record trên 1 trang,
     *     offset: vị trí bắt đầu,
     *     status?: lọc theo trạng thái (PENDING, CONFIRMED, PROCESSING, SHIPPING, DELIVERED, CANCELLED),
     *     q?: tìm kiếm theo số đơn hàng
     *   }
     * 
     * Return: {
     *   data: [ {...order1}, {...order2}, ... ],
     *   pagination: { total, totalPages, limit, offset }
     * }
     */
    async getUserOrders(userId, query) {
        const where = { userId: userId };
        
        // Lọc theo trạng thái (nếu có)
        if (query.status) where.status = query.status;
        
        // Tìm kiếm theo số đơn hàng (nếu có)
        if (query.q) where.orderNumber = { contains: query.q };
        
        // Query song song để tối ưu performance: lấy dữ liệu + đếm tổng
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    address: true,
                    orderDetails: true
                },
                skip: query.offset,
                take: query.limit,
                orderBy: { createdAt: "desc" }  // Đơn mới nhất ở trên
            }),
            prisma.order.count({ where })
        ]);
        
        return {
            data: orders,
            pagination: {
                total,
                totalPages: Math.ceil(total / query.limit),
                limit: query.limit,
                offset: query.offset
            }
        };
    }
    
    /**
     * Hủy đơn hàng của user
     * 
     * Params:
     *   orderId: ID đơn hàng
     *   userId: ID user (để kiểm tra quyền)
     *   reason: lý do hủy
     * 
     * Constraints:
     * - Chỉ có thể hủy đơn ở trạng thái PENDING hoặc CONFIRMED
     * - Sẽ hoàn trả stock sản phẩm
     * - Sẽ hoàn trả lượt sử dụng voucher (nếu có)
     * - Ghi log lịch sử thay đổi trạng thái
     * 
     * Transaction:
     * 1. Update order status → CANCELLED
     * 2. Hoàn stock cho mỗi sản phẩm
     * 3. Hoàn lượt sử dụng voucher
     * 4. Ghi orderLog
     */
    async cancelOrder(orderId, userId, reason) {
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId: userId },
            include: { orderDetails: true }
        });
        
        if (!order) throw new ServerException("Đơn hàng không tồn tại", 404);
        
        // Chỉ cho phép hủy đơn ở trạng thái PENDING hoặc CONFIRMED
        if (!["PENDING", "CONFIRMED"].includes(order.status)) {
            throw new ClientException("Không thể hủy đơn hàng này", 400);
        }
        
        await prisma.$transaction(async (tx) => {
            // 1. Cập nhật trạng thái đơn hàng
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "CANCELLED",
                    cancelReason: reason,
                    cancelledAt: new Date()
                }
            });
            
            // 2. Hoàn stock sản phẩm
            for (const item of order.orderDetails) {
                if (item.productVariantId) {
                    await tx.productVariant.update({
                        where: { id: item.productVariantId },
                        data: { stockQuantity: { increment: item.quantity } }
                    });
                }
            }
            
            // 3. Hoàn lượt sử dụng voucher
            if (order.voucherId) {
                await tx.voucher.update({
                    where: { id: order.voucherId },
                    data: { currentUsage: { decrement: 1 } }
                });
            }
            
            // 4. Ghi log lịch sử
            await tx.orderLog.create({
                data: {
                    orderId: orderId,
                    userId: userId,
                    oldStatus: order.status,
                    newStatus: "CANCELLED",
                    reason: reason
                }
            });
        });
        
        return { message: "Hủy đơn hàng thành công" };
    }
    
    /**
     * Lấy thống kê đơn hàng của user
     * 
     * Params:
     *   userId: ID user
     * 
     * Return: {
     *   pending: số đơn chờ xử lý,
     *   confirmed: số đơn đã xác nhận,
     *   processing: số đơn đang xử lý,
     *   shipping: số đơn đang vận chuyển,
     *   delivered: số đơn đã giao,
     *   cancelled: số đơn đã hủy,
     *   totalOrders: tổng tất cả đơn hàng,
     *   totalSpent: tổng tiền đã chi (chỉ tính đơn DELIVERED - chưa hủy)
     * }
     */
    async getUserOrderStats(userId) {
        // Query song song để lấy count theo trạng thái
        const [pending, confirmed, processing, shipping, delivered, cancelled] = await Promise.all([
            prisma.order.count({ where: { userId, status: "PENDING" } }),
            prisma.order.count({ where: { userId, status: "CONFIRMED" } }),
            prisma.order.count({ where: { userId, status: "PROCESSING" } }),
            prisma.order.count({ where: { userId, status: "SHIPPING" } }),
            prisma.order.count({ where: { userId, status: "DELIVERED" } }),
            prisma.order.count({ where: { userId, status: "CANCELLED" } })
        ]);
        
        // Tính tổng tiền chi (chỉ đơn DELIVERED)
        const totalSpent = await prisma.order.aggregate({
            where: {
                userId,
                status: "DELIVERED"
            },
            _sum: {
                total: true
            }
        });
        
        return {
            pending,
            confirmed,
            processing,
            shipping,
            delivered,
            cancelled,
            totalOrders: pending + confirmed + processing + shipping + delivered + cancelled,
            totalSpent: totalSpent._sum.total || 0
        };
    }
}