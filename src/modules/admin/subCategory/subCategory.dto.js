import { ClientException } from "../../../utils/errors.js";

export class createDto {
  constructor(data) {
    this.subcategoryName = data.subcategoryName?.trim();
    this.validate();
  }
  
  validate() {
    if (!this.subcategoryName || this.subcategoryName.length < 2) {
      throw new ClientException("Tên danh mục con phải có ít nhất 2 ký tự", 400);
    }
    
    if (this.subcategoryName.length > 100) {
      throw new ClientException("Tên danh mục con không được quá 100 ký tự", 400);
    }
  }
}