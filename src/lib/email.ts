import { Resend } from "resend";

export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  token: string
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email service is not configured. Please contact your administrator.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com";
  const APP_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${APP_URL}/reset-password/${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: "Reset your password — Secure QR Attendance",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
        <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Password Reset Request</h2>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
          Hi ${userName}, we received a request to reset your password for Secure QR Attendance.
          Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.
        </p>
        <a href="${resetUrl}"
          style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff;
                 text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Reset Password
        </a>
        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px;">
          If you didn't request this, you can safely ignore this email.<br/>
          This link will expire in 30 minutes.
        </p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="margin: 0; color: #d1d5db; font-size: 11px;">Secure QR Attendance System</p>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", JSON.stringify(error));
    throw new Error(error.message || "Failed to send email.");
  }

  console.log("[email] Sent successfully. ID:", data?.id, "| from:", FROM_EMAIL, "| to:", toEmail);
}
