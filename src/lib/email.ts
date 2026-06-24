import nodemailer from "nodemailer";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://adspace-phi.vercel.app";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent successfully: ", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("SMTP Error:", error);
    return { success: false, error };
  }
}

export const sendVerificationEmail = async (email: string, token: string, baseUrl?: string) => {
  const finalAppUrl = baseUrl || appUrl;
  const verifyLink = `${finalAppUrl}/verify-email?token=${token}`;
  
  const textContent = `
Welcome to AdSpace Marketplace!

Please verify your email address by visiting the link below:

${verifyLink}

Once verified, you can sign in using your registered email address and password.

Login URL:
${finalAppUrl}/login

Thank you for joining AdSpace Marketplace.
  `.trim();

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to AdSpace Marketplace!</h2>
    <p style="color: #334155; margin-bottom: 24px; line-height: 1.6;">
      Please verify your email address to activate your account. Click the button below to complete the verification process.
    </p>
    <a href="${verifyLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 24px;">Verify Email</a>
    <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="background-color: #f8fafc; padding: 12px; border-radius: 4px; color: #475569; word-break: break-all; font-size: 14px;">
      ${verifyLink}
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
    <p style="color: #64748b; font-size: 12px; text-align: center;">
      If you did not create an account, no further action is required.
    </p>
  </div>
  `;

  const result = await sendEmail(
    email,
    "Verify Your AdSpace Marketplace Account",
    htmlContent,
    textContent
  );

  if (!result.success) {
    throw new Error("Failed to send verification email via SMTP.");
  }

  return result;
};

export const sendPasswordResetEmail = async (email: string, token: string, baseUrl?: string) => {
  const finalAppUrl = baseUrl || appUrl;
  const resetLink = `${finalAppUrl}/reset-password?token=${token}`;
  
  const textContent = `
Password Reset Request

We received a request to reset your password for your AdSpace Marketplace account.
Please visit the following link to securely reset your password. This link will expire in 30 minutes.

${resetLink}

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
  `.trim();

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
    <p style="color: #334155; margin-bottom: 24px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to securely create a new password. This link will expire in 30 minutes.
    </p>
    <a href="${resetLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 24px;">Reset Password</a>
    <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="background-color: #f8fafc; padding: 12px; border-radius: 4px; color: #475569; word-break: break-all; font-size: 14px;">
      ${resetLink}
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
    <p style="color: #64748b; font-size: 12px; text-align: center;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  </div>
  `;

  const result = await sendEmail(
    email,
    "Reset Your AdSpace Marketplace Password",
    htmlContent,
    textContent
  );

  if (!result.success) {
    throw new Error("Failed to send password reset email via SMTP.");
  }

  return result;
};
