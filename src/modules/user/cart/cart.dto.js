import { ClientException } from "../../../utils/errors.js";

export class AddToCartDto {
  constructor(data) {
    this.productVariantId = data.productVariantId;
    this.quantity = data.quantity ? parseInt(data.quantity) : 1;
    this.userId = data.userId;
  }

  validate() {
    // Validate productVariantId - chỉ check có giá trị hay không
    if (!this.productVariantId) {
      throw new ClientException("Product variant ID là bắt buộc", 400);
    }

    // Convert sang string để đảm bảo format nhất quán
    this.productVariantId = String(this.productVariantId).trim();

    // Check không được rỗng sau khi trim
    if (this.productVariantId.length === 0) {
      throw new ClientException("Product variant ID không được rỗng", 400);
    }

    // Validate quantity
    if (isNaN(this.quantity) || !Number.isInteger(this.quantity)) {
      throw new ClientException("Số lượng phải là số nguyên", 400);
    }

    if (this.quantity <= 0) {
      throw new ClientException("Số lượng phải lớn hơn 0", 400);
    }
    
    if (this.quantity > 999) {
      throw new ClientException("Số lượng không được vượt quá 999", 400);
    }

    // Validate userId
    if (!this.userId) {
      throw new ClientException("User ID là bắt buộc", 400);
    }
  }
}

export class UpdateCartItemDto {
  constructor(data) {
    this.quantity = data.quantity ? parseInt(data.quantity) : null;
    this.userId = data.userId;
  }

  validate() {
    // Validate quantity
    if (this.quantity === null || isNaN(this.quantity)) {
      throw new ClientException("Số lượng là bắt buộc", 400);
    }

    if (!Number.isInteger(this.quantity)) {
      throw new ClientException("Số lượng phải là số nguyên", 400);
    }

    if (this.quantity <= 0) {
      throw new ClientException("Số lượng phải lớn hơn 0", 400);
    }
    
    if (this.quantity > 999) {
      throw new ClientException("Số lượng không được vượt quá 999", 400);
    }

    // Validate userId
    if (!this.userId) {
      throw new ClientException("User ID là bắt buộc", 400);
    }
  }
}

