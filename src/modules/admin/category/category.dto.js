import { ClientException } from "../../../utils/errors.js";

export class createDto {
  constructor(data) {
    // Accept new field `categoryName`, fallback to old `name` for compatibility
    this.categoryName = data.categoryName?.trim() || data.name?.trim();
    this.validate();
  }
  validate() {
    if(!this.categoryName || this.categoryName.length < 2) throw new ClientException("Ten dạnh mục phải lớn hơn hai ký tự ", 400);
  }
}
export class searchByKeyWordDto {
  constructor(data) {
    this.keyword = data.keyword?.trim();
    this.validate();
  }
  validate() {
    if(!this.keyword || this.keyword.length < 1) throw new ClientException("Từ khóa tìm kiếm không được để trống", 400);
  }
}