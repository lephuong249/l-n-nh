import { ClientException } from "../../../utils/errors.js";

export class createDto {
    constructor(data) {
        this.code = data.code?.trim();
        this.name = data.name?.trim();
        this.description = data.description?.trim();
        this.discountType = data.discountType; // PERCENTAGE hoặc FIXED
        this.discountValue = parseFloat(data.discountValue);
        this.minOrderValue = parseFloat(data.minOrderValue) || 0;
        this.maxUsage = parseInt(data.maxUsage);
        this.isActive = data.isActive !== false;
        this.validate();
    }
    
    validate() {
        if (!this.code || this.code.length < 3) throw new ClientException("Mã voucher phải lớn hơn 3 ký tự", 400);
        if (!this.name || this.name.length < 5) throw new ClientException("Tên voucher phải lớn hơn 5 ký tự", 400);
        if (!["PERCENTAGE", "FIXED"].includes(this.discountType)) throw new ClientException("Loại giảm giá phải là PERCENTAGE hoặc FIXED", 400);
        if (isNaN(this.discountValue) || this.discountValue <= 0) throw new ClientException("Giá trị giảm giá phải lớn hơn 0", 400);
        
        // Validation cho voucher %: phải là số nguyên từ 1-100
        if (this.discountType === "PERCENTAGE") {
            if (this.discountValue !== Math.floor(this.discountValue) || this.discountValue > 100) {
                throw new ClientException("Voucher % phải là số nguyên từ 1-100 (ví dụ: 10, 20, 50)", 400);
            }
        }
        
        if (isNaN(this.maxUsage) || this.maxUsage <= 0) throw new ClientException("Số lượt sử dụng phải lớn hơn 0", 400);
        if (this.minOrderValue < 0) throw new ClientException("Giá trị đơn hàng tối thiểu không được âm", 400);
    }
}