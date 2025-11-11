import prisma from "../../../../prisma/client.js"; 
import { ServerException ,ClientException} from "../../../../utils/errors.js";
import { generateVerificationToken,verifyVerificationToken ,generateResetcationToken,verifyResetcationToken} from "../../../../utils/token.js";
import { sendVerificationEmail,sendResetPasswordEmail } from "../../../../utils/sendmail.js";

export class ProfileService{
    async getProfile(userId){
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userName: true,
                
                birthday: true,
                email: true,
                phoneNumber: true,
                gender: true
            }
        });
        if(!user) throw new ClientException("Người dùng không tồn tại",404);
        return user;
    }

    async updateProfile(userId, profileData){
        if(await prisma.user.count({where: { email: profileData.email, id: { not: userId } }}) > 0){
            throw new ClientException("Email đã được sử dụng bởi người dùng khác",400);
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                userName: profileData.userName,
                
                birthday: new Date( profileData.birthday),
                phoneNumber: profileData.phoneNumber,   
                email: profileData.email,
                gender: profileData.gender
            }}
        );
        return user;
    }

    async sendMailResetPassword(email)
    {
        const user = await prisma.user.findUnique({where: { email:email }, });
    if(!user) throw new ServerException("Không tìm thấy tài khoản đăng ký với mail này", 404);

    const token = generateResetcationToken(user.id);
    await sendResetPasswordEmail(user, token);
    const passwordResetToken = await prisma.passwordResetToken.findFirst({where: { userId: user.id }, });
    if (passwordResetToken) await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    
    const newPasswordResetToken = await prisma.passwordResetToken.create({
      data: { 
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 900000) 
      }
    });
    return newPasswordResetToken;
    }
}
