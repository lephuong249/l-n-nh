
import bcrypt from "bcryptjs";
import prisma from "../../prisma/client.js"; 
import { ServerException } from "../../utils/errors.js";
import { generateVerificationToken,verifyVerificationToken ,generateResetcationToken,verifyResetcationToken} from "../../utils/token.js";
import { sendVerificationEmail,sendResetPasswordEmail } from "../../utils/sendmail.js";
import { generateToken } from "../../utils/jwt.util.js";
//import redis from "../../config/redis.js";
class AuthService {
  async register(data) {
    
    const existingUser = await prisma.user.findUnique({
      where: 
      { 
        email: data.email 
        }
    });
    if (existingUser) throw new ServerException("Email already registered", 409);
    
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        birthday: new Date(data.birthday),
        gender: data.gender,
        email: data.email,
        password: hashedPassword,
        role: "User",
      }
    });
    const token = generateVerificationToken(newUser.id);
    await sendVerificationEmail(newUser, token);
    const verifitoken= await prisma.verifiToken.findFirst({where: { userId: newUser.id }, });
    if(verifitoken) await prisma.verifiToken.deleteMany({ where: { userId: newUser.id } });
    await prisma.verifiToken.create({
      data: { 
        userId: newUser.id,
        token,
        expiresAt: new Date(Date.now() + 2592000000) 
      }
    });
    return newUser;
  }
  async verifyEmail(token) {
    if(!token) throw new ServerException("Verification token is required", 400);
    const verifitoken = await prisma.verifiToken.findFirst({ 
      where: { token, expiresAt: { gt: new Date() },used: false } 
    });
    if(!verifitoken) throw new ServerException("Invalid or expired verification token", 400);
    try {
      const decoded= verifyVerificationToken(token);
      const user=await prisma.user.update(
        {
          where: { id: decoded.userId },
          data: { isActive: true },
        }
      );
      await prisma.cart.create({ data: { userId: decoded.userId} });
      await prisma.wishlist.create({ data: { userId: decoded.userId} });
      await prisma.verifiToken.updateMany({ where: { userId: user.id }, data: { used: true } });
      return user;
    } catch (error) {
      throw new ServerException("Invalid or expired verification token", 400);
    }
  }

  async loginWithGoogle(profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new ServerException("Google account has no email", 400);

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: profile.name?.givenName || "",
          lastName: profile.name?.familyName || "",
          email,
          password: null, 
          role: "User",
          provider: "google",
          externalId: profile.id,
          isActive: true,
        },
      });
    }
    if(!await prisma.cart.findUnique({ where: { userId: user.id } })) await prisma.cart.create({ data: { userId: user.id} });
    if(!await prisma.wishlist.findUnique({ where: { userId: user.id } })) await prisma.wishlist.create({ data: { userId: user.id} });
    const token = generateToken(user);
    //await redis.set(`auth:user:${user.id}`, token, "EX", 3600);
    return { user, token };
  }

  async loginWithFacebook(profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new ServerException("Facebook account has no email", 400);

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const fullName = profile.displayName || profile._json?.name || "";
      let firstName = "";
      let lastName = "";

      if (fullName) {
        const parts = fullName.trim().split(" ");
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }

      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: null,
          role: "User",
          provider: "facebook",
          externalId: profile.id,
          isActive: true,
        },
      });
    }
    if(!await prisma.cart.findUnique({ where: { userId: user.id } })) await prisma.cart.create({ data: { userId: user.id} });
    if(!await prisma.wishlist.findUnique({ where: { userId: user.id } })) await prisma.wishlist.create({ data: { userId: user.id} });
    const token = generateToken(user);
    //await redis.set(`auth:user:${user.id}`, token, "EX", 3600);
    return { user, token };
  }
  
  async login(data) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if(!user) throw new ServerException("Không tìm thấy tài khoản đăng ký với mail này", 401);
    if(!user.isActive) throw new ServerException("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực tài khoản", 401);
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new ServerException("Password sai", 401);
    
    const token= generateToken(user);
    //await redis.set(`auth:user:${user.id}`, token, "EX", 3600);
    
    return { user:{id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role, }, token};
  }

  async sendMailResetPassword(data) {
    const user = await prisma.user.findUnique({where: { email: data.email }, });
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

  async resetPassword(token, data ) {
    if(!token) throw new ServerException("Reset token is required", 400);
    if(!(await prisma.passwordResetToken.findFirst({ where: { token, expiresAt: { gt: new Date() }, used: false } }))) throw new ServerException("Giao dịch hết hạn , vui lòng gửi lại yêu cầu ", 400);
    const decoded = verifyResetcationToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if(!user) throw new ServerException("User not found", 404);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    await prisma.passwordResetToken.updateMany({ where: { userId: user.id }, data: { used: true } });
    return { message: "Password reset successful" };
  }

  async me(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        }
    });
    if(!user) throw new ServerException("User not found", 404);
    return user;
  }
}

export default new AuthService();
