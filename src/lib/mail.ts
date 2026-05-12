import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const domain = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev", // Update this to your verified domain when going to production
    to: email,
    subject: "Confirm your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Verify your email address</h2>
        <p>Thank you for registering. Please confirm your email address by clicking the button below:</p>
        <div style="margin: 30px 0;">
          <a href="${confirmLink}" style="background-color: #c9f53b; color: #0c0c0c; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p>Or click this link if the button doesn't work:</p>
        <p><a href="${confirmLink}">${confirmLink}</a></p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/auth/reset-password?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev", // Update to verified domain in production
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reset your password</h2>
        <p>You requested a password reset. Click the button below to choose a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #c9f53b; color: #0c0c0c; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or click this link if the button doesn't work:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `
  });
};
