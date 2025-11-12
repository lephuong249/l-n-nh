import { createOrderDto, updateOrderStatusDto } from "./orders.dto.js";
import { adminOrderService } from "./orders.service.js";
import { successResponse, errorResponse } from "../../../utils/response.js";

const service = new adminOrderService();

export class adminOrderController {
    
    async create(req, res) {
        try {
            const dto = new createOrderDto(req.body);
            const order = await service.create(req.user.id, dto);
            return successResponse(res, order, "Tạo đơn hàng thành công", 201);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async getUserOrders(req, res) {
        try {
            const orders = await service.getUserOrders(req.user.id, req.validatedQuery);
            return successResponse(res, orders, "Lấy danh sách đơn hàng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async getOrderDetails(req, res) {
        try {
            const order = await service.getOrderDetails(req.params.id);
            
            if (req.user.role !== "ADMIN" && order.userId !== req.user.id) {
                return errorResponse(res, "Không có quyền truy cập", 403);
            }
            
            return successResponse(res, order, "Lấy chi tiết đơn hàng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async cancelOrder(req, res) {
        try {
            const { reason } = req.body;
            
            if (!reason || reason.trim().length < 10) {
                return errorResponse(res, "Lý do hủy phải có ít nhất 10 ký tự", 400);
            }
            
            const result = await service.cancelOrder(req.params.id, req.user.id, reason.trim());
            return successResponse(res, result, "Hủy đơn hàng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async getAll(req, res) {
        try {
            const orders = await service.getAll(req.validatedQuery);
            return successResponse(res, orders, "Lấy danh sách đơn hàng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async updateStatus(req, res) {
        try {
            const dto = new updateOrderStatusDto(req.body);
            const order = await service.updateStatus(req.params.id, dto, req.user.id);
            return successResponse(res, order, "Cập nhật trạng thái thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
}