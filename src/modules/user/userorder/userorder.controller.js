import { createOrderDto, cancelOrderDto } from "./userorder.dto.js";
import { userOrderService } from "./userorder.service.js";
import { successResponse, errorResponse } from "../../../utils/response.js";

// Khởi tạo service instance dùng chung cho tất cả methods
const service = new userOrderService();

/**
 * UserOrderController: xử lý tất cả HTTP request liên quan tới đơn hàng của user
 * - Tạo đơn hàng mới từ giỏ hàng
 * - Xem danh sách / chi tiết đơn hàng
 * - Hủy đơn hàng
 * - Xem thống kê đơn hàng
 */
export class userOrderController {
    
    /**
     * POST /uOrder - Tạo đơn hàng mới
     * 
     * Request body: {
     *   addressId: string (ID địa chỉ giao hàng - bắt buộc),
     *   paymentMethodId: string (ID phương thức thanh toán - bắt buộc),
     *   voucherCode?: string (mã voucher - tùy chọn),
     *   note?: string (ghi chú - tùy chọn, tối đa 500 ký tự)
     * }
     * 
     * Flow:
     * 1. Validate input dùng createOrderDto
     * 2. Gọi service.create() để tạo đơn hàng (sẽ kiểm tra giỏ hàng, stock, áp dụng voucher, v.v.)
     * 3. Trả về đơn hàng vừa tạo với status 201
     * 
     * Error: nếu validation fail hoặc service throw lỗi, trả về error response
     */
    async create(req, res) {
        try {
            const dto = new createOrderDto(req.body);
            const order = await service.create(req.user.id, dto);
            return successResponse(res, order, "Tạo đơn hàng thành công", 201);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    /**
     * GET /uOrder - Lấy danh sách đơn hàng của user (có pagination, search, filter)
     * 
     * Query params: {
     *   limit?: number (số record trên 1 trang, mặc định 10),
     *   offset?: number (vị trí bắt đầu, mặc định 0),
     *   q?: string (từ khóa tìm kiếm theo ID hoặc ghi chú),
     *   status?: string (filter theo trạng thái: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
     * }
     * 
     * Response: {
     *   data: [...orders],
     *   total: number,
     *   limit, offset
     * }
     */
    async getUserOrders(req, res) {
        try {
            const orders = await service.getUserOrders(req.user.id, req.validatedQuery);
            return successResponse(res, orders, "Lấy danh sách đơn hàng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    /**
     * GET /uOrder/:id - Lấy chi tiết một đơn hàng
     * 
     * URL params: {
     *   id: string (ID đơn hàng)
     * }
     * 
     * Response: {
     *   id, userId, totalAmount, status, ...,
     *   orderItems: [...], // chi tiết sản phẩm trong đơn hàng
     *   voucher: {...},    // thông tin voucher (nếu có)
     *   user: {...}        // thông tin user (name, email, phone)
     * }
     * 
     * Security: chỉ user sở hữu đơn hàng mới có quyền xem
     */
    async getOrderDetails(req, res) {
        try {
            const order = await service.getOrderDetails(req.params.id, req.user.id);
            return successResponse(res, order, "Lấy chi tiết đơn hàng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    /**
     * PUT /uOrder/:id/cancel - Hủy một đơn hàng
     * 
     * URL params: {
     *   id: string (ID đơn hàng)
     * }
     * 
     * Request body: {
     *   reason: string (lý do hủy, bắt buộc, 10-200 ký tự)
     * }
     * 
     * Constraints:
     * - Chỉ có thể hủy đơn ở trạng thái PENDING hoặc CONFIRMED
     * - Sẽ hoàn trả stock sản phẩm
     * - Sẽ hoàn trả lượt sử dụng voucher (nếu có)
     */
    async cancelOrder(req, res) {
        try {
            const dto = new cancelOrderDto(req.body);
            const result = await service.cancelOrder(req.params.id, req.user.id, dto.reason);
            return successResponse(res, result, "Hủy đơn hàng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    /**
     * GET /uOrder/stats - Lấy thống kê đơn hàng của user
     * 
     * Response: {
     *   totalOrders: number (tổng đơn hàng),
     *   pendingOrders: number (đơn chờ xử lý),
     *   completedOrders: number (đơn đã giao),
     *   cancelledOrders: number (đơn đã hủy),
     *   totalSpent: number (tổng tiền đã chi - không tính đơn hủy)
     * }
     */
    async getUserOrderStats(req, res) {
        try {
            const stats = await service.getUserOrderStats(req.user.id);
            return successResponse(res, stats, "Lấy thống kê đơn hàng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
}