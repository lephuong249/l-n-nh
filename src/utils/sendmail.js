import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(user, token) {
  const verifyUrl = `${process.env.APP_URL}/auth/verify?token=${token}`;
  const cancelUrl = `${process.env.APP_URL}/auth/cancel?token=${token}`;

  const html = `
  
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác nhận tài khoản Lina Beauty</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(rgba(255, 245, 250, 0.9), rgba(255, 237, 247, 0.9)), 
                  url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1920&q=80') no-repeat center center fixed;
      background-size: cover;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: auto;
      padding: 40px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(219, 39, 119, 0.15);
      overflow: hidden;
      position: relative;
      animation: slideIn 0.6s ease-out;
      border: 2px solid #fce7f3;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .header img {
      max-height: 90px;
      margin-bottom: 20px;
      border-radius: 16px;
      transition: transform 0.4s ease, box-shadow 0.4s ease;
    }
    .header img:hover {
      transform: scale(1.08);
      box-shadow: 0 0 20px rgba(219, 39, 119, 0.3);
    }
    .header h1 {
      color: #831843;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.8px;
      position: relative;
    }
    .header h1::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, #db2777, #ec4899);
      transform: translateX(-50%);
    }
    p {
      color: #1f2937;
      font-size: 17px;
      line-height: 1.8;
      margin: 20px 0;
    }
    .btn {
      display: inline-block;
      padding: 16px 40px;
      color: white !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin: 12px 10px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 0 15px rgba(219, 39, 119, 0.3);
    }
    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.4s ease;
    }
    .btn:hover::before {
      left: 100%;
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(219, 39, 119, 0.4);
    }
    .btn-confirm { 
      background: linear-gradient(135deg, #db2777, #ec4899);
    }
    .btn-cancel { 
      background: linear-gradient(135deg, #9ca3af, #d1d5db);
    }
    .footer {
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #fce7f3;
      padding-top: 20px;
      text-align: center;
      margin-top: 40px;
    }
    .highlight {
      color: #db2777;
      font-weight: 600;
    }
    .timer {
      font-size: 15px;
      color: #4b5563;
      text-align: center;
      margin: 28px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      animation: pulse 2s infinite;
    }
    .timer::before {
      content: '⏳';
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    @media (max-width: 480px) {
      .container {
        padding: 24px;
      }
      .header h1 {
        font-size: 26px;
      }
      .btn {
        display: block;
        text-align: center;
        margin: 16px auto;
        width: fit-content;
        padding: 14px 32px;
      }
      p {
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80" alt="Lina Beauty Logo" />
      <h1>✨ Chào mừng đến với <span class="highlight">Lina Beauty</span></h1>
    </div>

    <p>Xin chào <span class="highlight">${user.userName}</span>,</p>
    <p>
      Cảm ơn bạn đã đăng ký tài khoản tại <span class="highlight">Lina Beauty</span>. 
      Vui lòng nhấn nút xác nhận bên dưới để kích hoạt tài khoản của bạn 
      và bắt đầu trải nghiệm mua sắm mỹ phẩm chính hãng tuyệt vời!
    </p>

    <div style="text-align: center; margin: 36px 0;">
      <a href="${cancelUrl}" class="btn btn-cancel">Hủy bỏ</a>
      <a href="${verifyUrl}" class="btn btn-confirm">Xác nhận tài khoản</a>
    </div>

    <p class="timer">
      Link xác nhận sẽ hết hiệu lực sau <b>30 ngày</b>.
    </p>

    <div class="footer">
      Đây là email tự động, vui lòng không trả lời.<br/>
      Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.<br/>
      <br/>
      💖 <b>Lina Beauty</b> - Làm đẹp tự tin, tỏa sáng phong cách
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"Lina Beauty" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Xác nhận tài khoản Lina Beauty",
    html,
  });
}

export async function sendResetPasswordEmail(user, token) {
  const resetUrl = `${process.env.APP_URL}/auth/redirect-reset-password?token=${token}`;
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Đặt lại mật khẩu - Lina Beauty</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        background: linear-gradient(rgba(255, 245, 250, 0.9), rgba(255, 237, 247, 0.9)), 
                    url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1920&q=80') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .container {
        max-width: 800px;
        margin: auto;
        padding: 40px;
        background: rgba(255, 255, 255, 0.98);
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(219, 39, 119, 0.15);
        overflow: hidden;
        position: relative;
        animation: slideIn 0.6s ease-out;
        border: 2px solid #fce7f3;
        text-align: center;
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      h1 {
        font-size: 28px;
        color: #831843;
        margin-bottom: 10px;
      }
      p {
        color: #1f2937;
        line-height: 1.8;
        margin-bottom: 24px;
        font-size: 16px;
      }
      .btn {
        display: inline-block;
        color: white !important;
        text-decoration: none;
        background: linear-gradient(135deg, #db2777, #ec4899);
        padding: 16px 40px;
        font-size: 18px;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(219, 39, 119, 0.3);
        transition: all 0.3s ease;
      }
      .btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(219, 39, 119, 0.4);
      }
      .highlight {
        color: #db2777;
        font-weight: 600;
      }
      .footer {
        font-size: 14px;
        color: #6b7280;
        border-top: 1px solid #fce7f3;
        padding-top: 20px;
        margin-top: 40px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80" 
           alt="Lina Beauty Logo" style="max-height:80px;border-radius:12px;margin-bottom:15px;">
      <h1>✨ <span class="highlight">Lina Beauty</span></h1>
      <p>Xin chào <strong>${user.userName}</strong>,<br><br>
         Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <b>Lina Beauty</b> của bạn.<br/>
         Nhấn vào nút bên dưới để tạo mật khẩu mới.</p>
      <a href='${resetUrl}' class="btn">Đặt lại mật khẩu</a>
      <p style="margin-top:32px; font-size: 15px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>

      <div class="footer">
        Link này sẽ hết hạn sau <b>15 phút</b>.<br/>
        &copy; ${new Date().getFullYear()} <span class="highlight">Lina Beauty</span>. All rights reserved.<br/>
        💖 Làm đẹp tự tin, tỏa sáng phong cách
      </div>
    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"Lina Beauty" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Đặt lại mật khẩu Lina Beauty",
    html,
  });
}