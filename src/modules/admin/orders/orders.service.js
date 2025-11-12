import prisma from "../../../prisma/client.js";
import { ServerException, ClientException } from "../../../utils/errors.js";

export class adminOrderService {
    
    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `ORD${timestamp}${random}`;
    }
    
    async create(userId, data) {
        const address = await prisma.address.findFirst({
            where: { id: data.addressId, userId: userId }
        });
        if (!address) throw new ClientException("Địa chỉ không hợp lệ", 404);
        
        const paymentMethod = await prisma.paymentMethod.findFirst({
            where: { id: data.paymentMethodId, isActive: true }
        });
        if (!paymentMethod) throw new ClientException("Phương thức thanh toán không hợp lệ", 404);
        
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
        
        if (!cart || cart.cartDetails.length === 0) {
            throw new ClientException("Giỏ hàng trống", 400);
        }
        
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
            
            if (voucher && subtotal >= voucher.minOrderValue && voucher.currentUsage < voucher.maxUsage) {
                voucherId = voucher.id;
                
                if (voucher.discountType === "PERCENTAGE") {
                    voucherDiscount = (subtotal * voucher.discountValue) / 100;
                } else {
                    voucherDiscount = voucher.discountValue;
                }
                
                if (voucherDiscount > subtotal) voucherDiscount = subtotal;
            }
        }
        
        const total = subtotal - voucherDiscount;
        
        const order = await prisma.$transaction(async (tx) => {
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
            
            for (const item of cart.cartDetails) {
                const variant = item.productVariant;
                const variantName = `${variant.size} - ${variant.color}`;
                
                await tx.orderDetail.create({
                    data: {
                        orderId: newOrder.id,
                        productId: variant.productId,
                        productVariantId: variant.id,
                        productName: "", // Sẽ populate từ product
                        productImage: variant.variantImageUrl || "",
                        variantName: variantName,
                        price: variant.variantPrice || 0,
                        quantity: item.quantity,
                        subtotal: (variant.variantPrice || 0) * item.quantity
                    }
                });
                
                await tx.productVariant.update({
                    where: { id: variant.id },
                    data: { stockQuantity: { decrement: item.quantity } }
                });
            }
            
            if (voucherId) {
                await tx.voucher.update({
                    where: { id: voucherId },
                    data: { currentUsage: { increment: 1 } }
                });
            }
            
            await tx.cartDetail.deleteMany({
                where: { cartId: cart.id }
            });
            
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
        
        return await this.getOrderDetails(order.id);
    }
    
    async updateStatus(orderId, data, adminId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });
        
        if (!order) throw new ServerException("Đơn hàng không tồn tại", 404);
        
        const allowed = {
            PENDING: ["CONFIRMED", "CANCELLED"],
            CONFIRMED: ["PROCESSING", "CANCELLED"],
            PROCESSING: ["SHIPPING", "CANCELLED"],
            SHIPPING: ["DELIVERED"],
            DELIVERED: [],
            CANCELLED: []
        };
        
        if (!allowed[order.status]?.includes(data.status)) {
            throw new ClientException(`Không thể chuyển từ ${order.status} sang ${data.status}`, 400);
        }
        
        const updateData = {
            status: data.status,
            adminNote: data.adminNote
        };
        
        const now = new Date();
        if (data.status === "CONFIRMED") updateData.confirmedAt = now;
        if (data.status === "SHIPPING") updateData.shippedAt = now;
        if (data.status === "DELIVERED") updateData.deliveredAt = now;
        if (data.status === "CANCELLED") {
            updateData.cancelledAt = now;
            updateData.cancelReason = data.cancelReason;
        }
        
        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.order.update({
                where: { id: orderId },
                data: updateData
            });
            
            await tx.orderLog.create({
                data: {
                    orderId: orderId,
                    userId: adminId,
                    oldStatus: order.status,
                    newStatus: data.status,
                    reason: data.adminNote || data.cancelReason
                }
            });
            
            return result;
        });
        
        return updated;
    }
    
    async getOrderDetails(orderId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
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
    
    async getUserOrders(userId, query) {
        const where = { userId: userId };
        
        if (query.status) where.status = query.status;
        if (query.q) where.orderNumber = { contains: query.q };
        
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    address: true,
                    orderDetails: true
                },
                skip: query.offset,
                take: query.limit,
                orderBy: { createdAt: "desc" }
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
    
    async getAll(query) {
        const where = {};
        
        if (query.status) where.status = query.status;
        if (query.q) where.orderNumber = { contains: query.q };
        
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: { userName: true, email: true }
                    },
                    address: true
                },
                skip: query.offset,
                take: query.limit,
                orderBy: { createdAt: "desc" }
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
    
    async cancelOrder(orderId, userId, reason) {
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId: userId },
            include: { orderDetails: true }
        });
        
        if (!order) throw new ServerException("Đơn hàng không tồn tại", 404);
        
        if (!["PENDING", "CONFIRMED"].includes(order.status)) {
            throw new ClientException("Không thể hủy đơn hàng này", 400);
        }
        
        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "CANCELLED",
                    cancelReason: reason,
                    cancelledAt: new Date()
                }
            });
            
            for (const item of order.orderDetails) {
                if (item.productVariantId) {
                    await tx.productVariant.update({
                        where: { id: item.productVariantId },
                        data: { stockQuantity: { increment: item.quantity } }
                    });
                }
            }
            
            if (order.voucherId) {
                await tx.voucher.update({
                    where: { id: order.voucherId },
                    data: { currentUsage: { decrement: 1 } }
                });
            }
            
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
}
