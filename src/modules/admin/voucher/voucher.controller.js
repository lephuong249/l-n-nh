import {createDto} from "./voucher.dto.js";
import {voucherService} from "./voucher.service.js";
import { successResponse, errorResponse } from "../../../utils/response.js";

export class voucherController {
    // Admin methods
    async create(req, res, next) {
        try {
            const voucher = await new voucherService().create(new createDto(req.body));
            return successResponse(res, voucher, "Tạo voucher thành công", 201);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async update(req, res, next) {
        try {
            const voucher = await new voucherService().update(req.params.id, new createDto(req.body));
            return successResponse(res, voucher, "Cập nhật voucher thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async delete(req, res, next) {
        try {
            const result = await new voucherService().delete(req.params.id);
            return successResponse(res, result, "Xóa voucher thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async getAll(req, res, next) {
        try {
            const vouchers = await new voucherService().getAll(req.validatedQuery);
            return successResponse(res, vouchers, "Lấy danh sách voucher thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async getVoucherStats(req, res, next) {
        try {
            const stats = await new voucherService().getVoucherStats(req.params.id);
            return successResponse(res, stats, "Lấy thống kê voucher thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    // User methods
    async getAvailableVouchers(req, res, next) {
        try {
            const { orderValue } = req.query;
            if (!orderValue || isNaN(orderValue)) {
                return errorResponse(res, "Giá trị đơn hàng là bắt buộc", 400);
            }
            
            const vouchers = await new voucherService().getAvailableVouchers(parseFloat(orderValue));
            return successResponse(res, vouchers, "Lấy voucher khả dụng thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    async applyVoucher(req, res, next) {
        try {
            const { code, orderValue } = req.body;
            if (!code || !orderValue) {
                return errorResponse(res, "Mã voucher và giá trị đơn hàng là bắt buộc", 400);
            }
            
            const result = await new voucherService().applyVoucher(code, parseFloat(orderValue));
            return successResponse(res, result, "Áp dụng voucher thành công", 200);
        } catch (error) {
            return errorResponse(res, error.message, error.status || 500);
        }
    }
    
    // Method để validate voucher trước khi checkout
    async validateVoucher(req, res, next) {
        try {
            const { code } = req.params;
            const { orderValue } = req.body;
            
            if (!orderValue || isNaN(orderValue)) {
                return errorResponse(res, "Giá trị đơn hàng là bắt buộc", 400);
            }
            
            const result = await new voucherService().applyVoucher(code, parseFloat(orderValue));
            
            return successResponse(res, {
                valid: true,
                voucher: result.voucher,
                discountAmount: result.discountAmount,
                finalAmount: result.finalAmount,
                message: `Voucher hợp lệ - Giảm ${result.discountAmount.toLocaleString()}đ`
            }, "Voucher hợp lệ", 200);
        } catch (error) {
            return successResponse(res, {
                valid: false,
                message: error.message
            }, "Voucher không hợp lệ", 200);
        }
    }
}