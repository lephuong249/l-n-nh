import { ClientException } from "../../../utils/errors.js";

/**
 * DTO (Data Transfer Object) dùng để validate và transform input từ client
 * 
 * createOrderDto: validate dữ liệu khi tạo đơn hàng
 * cancelOrderDto: validate dữ liệu khi hủy đơn hàng
 */

/**
 * createOrderDto: Validate input khi tạo đơn hàng mới
 * 
 * Input fields:
 *   addressId: ID địa chỉ giao hàng (bắt buộc, được trim)
 *   paymentMethodId: ID phương thức thanh toán (bắt buộc, được trim)
 *   voucherCode?: mã voucher (tùy chọn, được trim)
 *   note?: ghi chú đơn hàng (tùy chọn, được trim, tối đa 500 ký tự)
 * 
 * Validation rules:
 *   - addressId: bắt buộc
 *   - paymentMethodId: bắt buộc
 *   - note: tối đa 500 ký tự (nếu có)
 */
export class createOrderDto {
    constructor(data) {
        this.addressId = data.addressId?.trim();
        this.paymentMethodId = data.paymentMethodId?.trim();
        this.voucherCode = data.voucherCode?.trim();
        this.note = data.note?.trim();
        this.validate();
    }
    
    validate() {
        // Kiểm tra addressId không để trống
        if (!this.addressId) {
            throw new ClientException("Vui lòng chọn địa chỉ giao hàng", 400);
        }
        
        // Kiểm tra paymentMethodId không để trống
        if (!this.paymentMethodId) {
            throw new ClientException("Vui lòng chọn phương thức thanh toán", 400);
        }
        
        // Kiểm tra ghi chú không vượt quá 500 ký tự
        if (this.note && this.note.length > 500) {
            throw new ClientException("Ghi chú không được quá 500 ký tự", 400);
        }
    }
}

/**
 * cancelOrderDto: Validate input khi hủy đơn hàng
 * 
 * Input fields:
 *   reason: lý do hủy (bắt buộc, được trim, 10-200 ký tự)
 * 
 * Validation rules:
 *   - reason: bắt buộc, tối thiểu 10 ký tự (để đảm bảo có thông tin chi tiết)
 *   - reason: tối đa 200 ký tự
 */
export class cancelOrderDto {
    constructor(data) {
        this.reason = data.reason?.trim();
        this.validate();
    }
    
    validate() {
        // Kiểm tra reason không để trống và tối thiểu 10 ký tự
        if (!this.reason || this.reason.length < 10) {
            throw new ClientException("Lý do hủy phải có ít nhất 10 ký tự", 400);
        }
        
        // Kiểm tra reason không vượt quá 200 ký tự
        if (this.reason.length > 200) {
            throw new ClientException("Lý do hủy không được quá 200 ký tự", 400);
        }
    }
}