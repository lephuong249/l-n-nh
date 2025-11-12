import { ClientException } from "../../../utils/errors.js";

export class createDto {
  constructor(data) {
    this.categoryName = data.categoryName?.trim();
    this.validate();
  }
  
  validate() {
    if (!this.categoryName || this.categoryName.length < 2) {
      throw new ClientException("Tên danh mục phải lớn hơn 2 ký tự", 400);
    }
    if (this.categoryName.length > 100) {
      throw new ClientException("Tên danh mục không được vượt quá 100 ký tự", 400);
    }
  }
}

export class searchByKeyWordDto {
  constructor(data) {
    this.keyword = data.keyword?.trim();
    this.validate();
  }
  
  validate() {
    if (!this.keyword || this.keyword.length < 1) {
      throw new ClientException("Từ khóa tìm kiếm không được để trống", 400);
    }
  }
}