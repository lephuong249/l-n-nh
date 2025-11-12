import { ClientException } from "../../../utils/errors.js";

export class createOrderDto {
    constructor(data) {
        this.addressId = data.addressId?.trim();
        this.paymentMethodId = data.paymentMethodId?.trim();
        this.voucherCode = data.voucherCode?.trim();
        this.note = data.note?.trim();
        this.validate();
    }
    
    validate() {
        if (!this.addressId) {
            throw new ClientException("Vui lòng chọn địa chỉ giao hàng", 400);
        }
        
        if (!this.paymentMethodId) {
            throw new ClientException("Vui lòng chọn phương thức thanh toán", 400);
        }
    }
}

export class updateOrderStatusDto {
    constructor(data) {
        this.status = data.status;
        this.adminNote = data.adminNote?.trim();
        this.cancelReason = data.cancelReason?.trim();
        this.validate();
    }
    
    validate() {
        const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"];
        
        if (!validStatuses.includes(this.status)) {
            throw new ClientException("Trạng thái không hợp lệ", 400);
        }
        
        if (this.status === "CANCELLED" && !this.cancelReason) {
            throw new ClientException("Vui lòng nhập lý do hủy đơn", 400);
        }
    }
}