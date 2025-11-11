import { ClientException } from "../../../../utils/errors.js";

export class UpdateDto {
  constructor(data) {
    this.userName = data.userName?.trim();
    
    this.email = data.email?.toLowerCase();
    this.phoneNumber = data.phoneNumber?.trim();
    this.birthday = data.birthday;
    this.gender = data.gender;

    this.validate();
  }

  validate() {
    if (!this.userName || this.userName.length < 2) throw new ClientException("User name must be at least 2 characters", 400);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) throw new ClientException("Invalid email format", 400);
    if(!this.birthday) throw new ClientException("Vui lòng nhập ngày tháng năm sinh", 400);
    if(!this.gender) throw new ClientException("Vui lòng chọn giới tính", 400);
    if(new Date().getFullYear()-new Date(this.birthday).getFullYear()<18) throw new ClientException("Người dùng phải đủ 18 tuổi", 400);
    const phoneRegex = /^(0|\+84)(\d{9})$/;
    if (!phoneRegex.test(this.phoneNumber))
      throw new ClientException("Số điện thoại không hợp lệ", 400);
  }
}