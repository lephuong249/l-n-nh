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
  <title>Confirm Your LUDUS Account</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), 
                  url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80') no-repeat center center fixed;
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
      background: rgba(255, 255, 255, 0.95);
      border-radius: 10px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      position: relative;
      animation: slideIn 0.6s ease-out;
      border: #ECECEC 1px solid;
      box-shadow: #0f172a 5px 5px 5px 5px;
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
      box-shadow: 0 0 20px rgba(15, 23, 42, 0.3);
    }
    .header h1 {
      color: #0f172a;
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
      background: linear-gradient(90deg, #0f172a, #1e40af);
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
      box-shadow: 0 0 15px rgba(15, 23, 42, 0.3);
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
      box-shadow: 0 8px 25px rgba(15, 23, 42, 0.4);
    }
    .btn-confirm { 
      background: linear-gradient(135deg, #0f172a, #1e40af);
    }
    .btn-cancel { 
      background: linear-gradient(135deg, #dc2626, #f87171);
    }
    .footer {
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      text-align: center;
      margin-top: 40px;
    }
    .highlight {
      color: #0f172a;
      font-weight: 600;
    }
    .highlight-l {
      color: #dc2626;
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
      <img src="https://i.pinimg.com/736x/fa/eb/a1/faeba1ac95a922f8c9cd7b7fcf86b28b.jpg" alt="LUDUS Logo" />
      <h1>Welcome to <span class="highlight-l">L</span><span class="highlight">UDUS</span></h1>
    </div>

    <p>Hello <span class="highlight">${user.userName}</span>,</p>
    <p>
      Thank you for registering an account with <span class="highlight-l">L</span><span class="highlight">UDUS</span>. 
      Please click the button below to confirm and activate your account, 
      and get ready to explore an exceptional shopping experience!
    </p>

    <div style="text-align: center; margin: 36px 0;">
      <a href="${cancelUrl}" class="btn btn-cancel">Cancel</a>
      <a href="${verifyUrl}" class="btn btn-confirm">Confirm</a>
    </div>

    <p class="timer">
      The confirmation link will expire in <b> 30 days</b>.
    </p>

    <div class="footer">
      This is an automated email, please do not reply.<br/>
      If you did not create an account, please ignore this email.
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"LUDUS Shop" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Xác nhận tài khoản LUDUS",
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
    <title>Reset Your Password - LUDUS</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        background: linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), 
                    url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh; /* ✨ giúp căn giữa theo chiều dọc */
      }
      .container {
        max-width: 800px;
        margin: auto;
        padding: 40px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        position: relative;
        animation: slideIn 0.6s ease-out;
        border: #ECECEC 1px solid;
        box-shadow: #0f172a 5px 5px 5px 5px;
        text-align: center;
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      h1 {
        font-size: 28px;
        color: #0f172a;
        margin-bottom: 10px;
      }
      p {
        color: #1f2937;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      input[type="password"] {
        width: 80%;
        padding: 12px;
        margin: 10px 0;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        font-size: 16px;
      }
      button {
        background: linear-gradient(135deg, #0f172a, #1e40af);
        color: white;
        padding: 14px 30px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 0 10px rgba(15, 23, 42, 0.3);
      }
      button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.4);
      }
      .error {
        color: #dc2626;
        font-size: 14px;
        margin-top: 8px;
        height: 18px;
      }
      .highlight {
        color: #0f172a;
        font-weight: 600;
      }
      .highlight-l {
        color: #dc2626;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <img src="https://i.pinimg.com/736x/fa/eb/a1/faeba1ac95a922f8c9cd7b7fcf86b28b.jpg" 
           alt="LUDUS Logo" style="max-height:80px;border-radius:12px;margin-bottom:15px;">
      <h1>Welcome to <span class="highlight-l">L</span><span class="highlight">UDUS</span></h1>
      <p>Hello <strong>${user.userName}</strong>,<br>
         We received a request to reset your password for your <b><span class="highlight-l">L</span><span class="highlight">UDUS</span></b> account.<br/>
      Click the button below to set a new password</p>
      <a href='${resetUrl}' class="btn" style="color: red; text-decoration: none;background-color: white;padding:15px 20px 15px 20px;font-size: 20px; border: solid 2px red;border-radius: 20px;font-weight: bold;">Reset Password</a>
      <p style="margin-top:24px;">If you didn’t request a password reset, you can safely ignore this email.</p>

      <div class="footer">
        This link will expire in <b>15 minutes</b>.<br/>
        &copy; ${new Date().getFullYear()} <span class="highlight-l">L</span><span class="highlight">UDUS</span>. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"LUDUS Shop" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Reset your LUDUS password",
    html,
  });
}
