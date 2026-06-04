import { Resend } from "resend";
import { SubmissionEmail } from "@/emails/SubmissionEmail";
import { ApprovalEmail } from "@/emails/ApprovalEmail";
import { RevisionEmail } from "@/emails/RevisionEmail";
import { RejectionEmail } from "@/emails/RejectionEmail";
import { PublicationEmail } from "@/emails/PublicationEmail";
import { PublicAnnouncementEmail } from "@/emails/PublicAnnouncementEmail";
import prisma from "@/lib/prisma";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const domain = process.env.NEXTAUTH_URL || "http://localhost:3000";
const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

// ─── Existing Auth Emails ────────────────────────────────

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  await resend.emails.send({
    from: fromEmail,
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
    from: fromEmail,
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

// ─── Notification Email Types ────────────────────────────

export type NotificationEmailType =
  | "SUBMITTED"
  | "APPROVED"
  | "REVISION"
  | "REJECTED"
  | "PUBLISHED";

// ─── Resource Type Display Names ─────────────────────────

const RESOURCE_TYPE_DISPLAY: Record<string, string> = {
  journal: "Journal",
  conference: "Conference",
  "book-chapter": "Book Chapter",
  patent: "Patent",
  copyright: "Copyright",
  fdp: "FDP",
  certificate: "Certificate",
  achievement: "Achievement",
};

// ─── Public URL Mapping ─────────────────────────────────

const PUBLIC_URL_MAP: Record<string, string> = {
  journal: "/publications/journals",
  conference: "/publications/conferences",
  "book-chapter": "/publications/book-chapters",
  patent: "/publications/patents",
  copyright: "/publications/copyrights",
};

// ─── Subject Line Generation ─────────────────────────────

function getSubjectLine(
  type: NotificationEmailType,
  resourceType: string,
  resourceTitle: string,
  isAdminNotification?: boolean
): string {
  const displayType =
    RESOURCE_TYPE_DISPLAY[resourceType] || resourceType;

  switch (type) {
    case "SUBMITTED":
      return `New ${displayType} Submission: "${resourceTitle}"`;
    case "APPROVED":
      return isAdminNotification
        ? `${displayType} Ready for Publication: "${resourceTitle}"`
        : `Your ${displayType} Has Been Approved: "${resourceTitle}"`;
    case "REVISION":
      return `Revision Requested: "${resourceTitle}"`;
    case "REJECTED":
      return `Submission Declined: "${resourceTitle}"`;
    case "PUBLISHED":
      return `🎉 Published: "${resourceTitle}"`;
    default:
      return `Update on "${resourceTitle}"`;
  }
}

// ─── Send Notification Email ─────────────────────────────

export interface NotificationEmailParams {
  to: string;
  recipientName: string;
  type: NotificationEmailType;
  resourceType: string;
  resourceTitle: string;
  dashboardLink: string;
  message?: string;
  submittedBy?: string;
  reviewerName?: string;
  isAdminNotification?: boolean;
  publicLink?: string;
}

export const sendNotificationEmail = async (
  params: NotificationEmailParams
): Promise<void> => {
  const {
    to,
    recipientName,
    type,
    resourceType,
    resourceTitle,
    dashboardLink,
    message,
    submittedBy,
    reviewerName,
    isAdminNotification,
    publicLink,
  } = params;

  const fullDashboardLink = dashboardLink.startsWith("http")
    ? dashboardLink
    : `${domain}${dashboardLink}`;

  const fullPublicLink = publicLink
    ? publicLink.startsWith("http")
      ? publicLink
      : `${domain}${publicLink}`
    : undefined;

  const displayType =
    RESOURCE_TYPE_DISPLAY[resourceType] || resourceType;

  let reactEmail: React.ReactElement;

  switch (type) {
    case "SUBMITTED":
      reactEmail = React.createElement(SubmissionEmail, {
        recipientName,
        resourceType: displayType,
        resourceTitle,
        submittedBy: submittedBy || "A team member",
        dashboardLink: fullDashboardLink,
      });
      break;
    case "APPROVED":
      reactEmail = React.createElement(ApprovalEmail, {
        recipientName,
        resourceType: displayType,
        resourceTitle,
        approvedBy: reviewerName,
        dashboardLink: fullDashboardLink,
        isAdminNotification: isAdminNotification || false,
      });
      break;
    case "REVISION":
      reactEmail = React.createElement(RevisionEmail, {
        recipientName,
        resourceType: displayType,
        resourceTitle,
        revisionReason: message,
        reviewerName,
        dashboardLink: fullDashboardLink,
      });
      break;
    case "REJECTED":
      reactEmail = React.createElement(RejectionEmail, {
        recipientName,
        resourceType: displayType,
        resourceTitle,
        rejectionReason: message,
        dashboardLink: fullDashboardLink,
      });
      break;
    case "PUBLISHED":
      reactEmail = React.createElement(PublicationEmail, {
        recipientName,
        resourceType: displayType,
        resourceTitle,
        publicLink: fullPublicLink || fullDashboardLink,
        dashboardLink: fullDashboardLink,
      });
      break;
    default:
      return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: getSubjectLine(
        type,
        resourceType,
        resourceTitle,
        isAdminNotification
      ),
      react: reactEmail,
    });
  } catch (error) {
    console.error(
      `[Email] Failed to send ${type} email to ${to}:`,
      error
    );
  }
};

// ─── Broadcast Public Announcement Email ─────────────────

export interface BroadcastEmailParams {
  resourceType: string;
  resourceTitle: string;
  resourceId: string;
  authors: string[];
  excludeUserIds?: string[];
}

export const broadcastPublicationEmail = async (
  params: BroadcastEmailParams
): Promise<void> => {
  const {
    resourceType,
    resourceTitle,
    resourceId,
    authors,
    excludeUserIds = [],
  } = params;

  const displayType =
    RESOURCE_TYPE_DISPLAY[resourceType] || resourceType;

  const publicPath = PUBLIC_URL_MAP[resourceType];
  const publicLink = publicPath
    ? `${domain}${publicPath}?id=${resourceId}`
    : `${domain}/dashboard`;

  try {
    // Fetch all users with verified emails, excluding authors (they get a separate email)
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        emailVerified: { not: null },
        ...(excludeUserIds.length > 0 && {
          id: { notIn: excludeUserIds },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (users.length === 0) return;

    // Send in batches of 50 to avoid Resend rate limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const emailPromises = batch.map((user) => {
        if (!user.email) return Promise.resolve();

        const reactEmail = React.createElement(PublicAnnouncementEmail, {
          recipientName: user.name || "Member",
          resourceType: displayType,
          resourceTitle,
          publicLink,
          authors,
        });

        return resend.emails
          .send({
            from: fromEmail,
            to: user.email,
            subject: `📢 New ${displayType} Published: "${resourceTitle}"`,
            react: reactEmail,
          })
          .catch((err) => {
            console.error(
              `[Email] Failed to send announcement to ${user.email}:`,
              err
            );
          });
      });

      await Promise.allSettled(emailPromises);
    }

    console.log(
      `[Email] Broadcast sent to ${users.length} users for ${resourceType}: "${resourceTitle}"`
    );
  } catch (error) {
    console.error(
      `[Email] Failed to broadcast publication email:`,
      error
    );
  }
};
