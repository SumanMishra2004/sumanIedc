import { Resend } from "resend";
import { GrantEmail } from "@/emails/GrantEmail";
import React from "react";
import prisma from "@/lib/prisma";
import { UserRole, GrantInRole, GrantInStatus } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);
const domain = process.env.NEXTAUTH_URL || "http://localhost:3000";
const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

interface NotificationParams {
  userId: string;
  email?: string | null;
  name?: string | null;
  title: string;
  message: string;
  type: string;
  link: string;
  emailParams: {
    badgeText: string;
    badgeType: "info" | "success" | "warning" | "error";
    emailSubject: string;
    heading: string;
    bodyText: string;
    projectCode: string;
    projectTitle?: string;
    statusText: string;
  };
}

async function sendNotification({
  userId,
  email,
  name,
  title,
  message,
  type,
  link,
  emailParams,
}: NotificationParams) {
  // 1. Create DB Notification
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (err) {
    console.error(`[Notification DB Error] Failed to notify user ${userId}:`, err);
  }

  // 2. Send Email via Resend
  if (email && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: emailParams.emailSubject,
        react: React.createElement(GrantEmail, {
          recipientName: name || "Member",
          badgeText: emailParams.badgeText,
          badgeType: emailParams.badgeType,
          emailSubject: emailParams.emailSubject,
          heading: emailParams.heading,
          bodyText: emailParams.bodyText,
          projectCode: emailParams.projectCode,
          projectTitle: emailParams.projectTitle,
          statusText: emailParams.statusText,
          dashboardLink: `${domain}${link}`,
        }),
      });
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${email}:`, err);
    }
  }
}

// 1. Notify on Grant Proposal Creation (Applied)
export async function notifyGrantApplied(grantId: string) {
  try {
    const grant = await prisma.grantIn.findUnique({
      where: { id: grantId },
      include: {
        facultyAuthors: { include: { user: true } },
        studentAuthors: { include: { user: true } },
      },
    });

    if (!grant) return;

    const projectCode = grant.projectCode || "N/A";

    // A. Notify PIs and Co-PIs
    const piCoPiEntries = grant.facultyAuthors.filter(
      (fa) => fa.role === GrantInRole.FACULTY_PI || fa.role === GrantInRole.FACULTY_COPI
    );

    for (const entry of piCoPiEntries) {
      await sendNotification({
        userId: entry.userId,
        email: entry.user.email,
        name: entry.user.name,
        title: "Assigned as PI/Co-PI on Grant Proposal",
        message: `You have been assigned as PI/Co-PI on the new Grant Proposal: ${projectCode}.`,
        type: "GRANT_ASSIGNED",
        link: `/dashboard/grant/${grantId}`,
        emailParams: {
          badgeText: "Proposal Submitted",
          badgeType: "info",
          emailSubject: `Assigned as PI/Co-PI on new Grant: ${projectCode}`,
          heading: "Assigned as PI/Co-PI on Grant Proposal",
          bodyText: `You have been designated as a PI/Co-PI on the new Grant-In-Aid project code ${projectCode}. Please review the application details in the dashboard.`,
          projectCode,
          statusText: "Applied (Pending Review)",
        },
      });
    }

    // B. Notify other authors (co-authors, students)
    const otherFacultyEntries = grant.facultyAuthors.filter(
      (fa) => fa.role === GrantInRole.AUTHOR
    );
    
    const allOtherAuthors = [
      ...otherFacultyEntries.map(f => ({ id: f.userId, user: f.user, role: "Faculty Author" })),
      ...grant.studentAuthors.map(s => ({ id: s.userId, user: s.user, role: "Student Author" })),
    ];

    for (const author of allOtherAuthors) {
      await sendNotification({
        userId: author.id,
        email: author.user.email,
        name: author.user.name,
        title: "Added to Grant Proposal",
        message: `You have been listed as a ${author.role} on the new Grant Proposal: ${projectCode}.`,
        type: "GRANT_ADDED",
        link: `/dashboard/grant/${grantId}`,
        emailParams: {
          badgeText: "Proposal Submitted",
          badgeType: "info",
          emailSubject: `Added to new Grant Proposal: ${projectCode}`,
          heading: `Added as ${author.role}`,
          bodyText: `You have been listed as a ${author.role.toLowerCase()} on the newly applied Grant-In-Aid project code ${projectCode}.`,
          projectCode,
          statusText: "Applied (Pending Review)",
        },
      });
    }

    // C. Notify all Admins
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
    });

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        title: "New Grant Proposal Submitted",
        message: `A new Grant Proposal has been submitted: ${projectCode}.`,
        type: "GRANT_SUBMITTED",
        link: `/dashboard/grant/${grantId}`,
        emailParams: {
          badgeText: "Proposal Submitted",
          badgeType: "info",
          emailSubject: `New Grant Proposal Submitted: ${projectCode}`,
          heading: "New Grant Proposal Submitted",
          bodyText: `A new Grant-In-Aid proposal with project code ${projectCode} has been submitted and is awaiting admin approval or status update.`,
          projectCode,
          statusText: "Applied (Awaiting Review)",
        },
      });
    }
  } catch (error) {
    console.error("Error in notifyGrantApplied:", error);
  }
}

// 2. Notify on Grant Status Change (Granted, Rejected, Completed)
export async function notifyGrantStatusUpdated(
  grantId: string,
  oldStatus: GrantInStatus,
  newStatus: GrantInStatus
) {
  if (oldStatus === newStatus) return;

  try {
    const grant = await prisma.grantIn.findUnique({
      where: { id: grantId },
      include: {
        facultyAuthors: { include: { user: true } },
        studentAuthors: { include: { user: true } },
      },
    });

    if (!grant) return;

    const projectCode = grant.projectCode || "N/A";
    
    // Customize badge styling based on new status
    let badgeType: "info" | "success" | "warning" | "error" = "info";
    let statusText = newStatus.toString();
    
    if (newStatus === GrantInStatus.GRANTED) {
      badgeType = "success";
      statusText = "Granted (Approved)";
    } else if (newStatus === GrantInStatus.REJECTED) {
      badgeType = "error";
      statusText = "Rejected";
    } else if (newStatus === GrantInStatus.COMPLETED) {
      badgeType = "success";
      statusText = "Completed";
    }

    const allAuthors = [
      ...grant.facultyAuthors.map(fa => fa.user),
      ...grant.studentAuthors.map(sa => sa.user),
    ];

    for (const author of allAuthors) {
      await sendNotification({
        userId: author.id,
        email: author.email,
        name: author.name,
        title: "Grant Status Updated",
        message: `The status of Grant Proposal ${projectCode} has been updated to ${newStatus}.`,
        type: "GRANT_STATUS_UPDATED",
        link: `/dashboard/grant/${grantId}`,
        emailParams: {
          badgeText: `Grant ${newStatus}`,
          badgeType,
          emailSubject: `Grant Status Updated: ${projectCode}`,
          heading: "Grant Status Updated",
          bodyText: `The status of the Grant-In-Aid project code ${projectCode} has been changed to ${statusText}.`,
          projectCode,
          statusText,
        },
      });
    }
  } catch (error) {
    console.error("Error in notifyGrantStatusUpdated:", error);
  }
}

// 3. Notify PIs when Bill is Uploaded
export async function notifyBillUploaded(grantId: string, billId: string) {
  try {
    const bill = await prisma.grantInBill.findUnique({
      where: { id: billId },
      include: {
        user: true,
        grantIn: {
          include: {
            facultyAuthors: { include: { user: true } },
          },
        },
      },
    });

    if (!bill) return;

    const projectCode = bill.grantIn.projectCode || "N/A";
    const uploaderName = bill.user.name || "A team member";
    const billAmountStr = `INR ${bill.amount ? bill.amount.toLocaleString("en-IN") : "0"}`;

    const piCoPiEntries = bill.grantIn.facultyAuthors.filter(
      (fa) => fa.role === GrantInRole.FACULTY_PI || fa.role === GrantInRole.FACULTY_COPI
    );

    for (const entry of piCoPiEntries) {
      await sendNotification({
        userId: entry.userId,
        email: entry.user.email,
        name: entry.user.name,
        title: "New Expense Bill Pending Review",
        message: `A new bill for ${billAmountStr} uploaded by ${uploaderName} is pending your review.`,
        type: "BILL_PENDING_REVIEW",
        link: `/dashboard/grant/${grantId}`,
        emailParams: {
          badgeText: "Bill Review",
          badgeType: "warning",
          emailSubject: `Expense Bill Pending Review: ${projectCode}`,
          heading: "New Bill Uploaded",
          bodyText: `${uploaderName} has uploaded a new expense bill of amount ${billAmountStr} for project code ${projectCode}. Please review and verify it on the dashboard.`,
          projectCode,
          statusText: "Pending PI Approval",
        },
      });
    }
  } catch (error) {
    console.error("Error in notifyBillUploaded:", error);
  }
}

// 4. Notify on Bill Accepted
export async function notifyBillAccepted(grantId: string, billId: string) {
  try {
    const bill = await prisma.grantInBill.findUnique({
      where: { id: billId },
      include: {
        user: true,
        grantIn: true,
      },
    });

    if (!bill) return;

    const projectCode = bill.grantIn.projectCode || "N/A";
    const billAmountStr = `INR ${bill.amount ? bill.amount.toLocaleString("en-IN") : "0"}`;

    // A. Notify Uploader
    await sendNotification({
      userId: bill.userId,
      email: bill.user.email,
      name: bill.user.name,
      title: "Expense Bill Approved by PI",
      message: `Your expense bill of ${billAmountStr} for project ${projectCode} has been approved by the PI.`,
      type: "BILL_APPROVED",
      link: `/dashboard/grant/${grantId}`,
      emailParams: {
        badgeText: "Bill Approved",
        badgeType: "success",
        emailSubject: `Expense Bill Approved: ${projectCode}`,
        heading: "Expense Bill Approved",
        bodyText: `Your expense bill of ${billAmountStr} has been successfully verified and approved by the project PI. It is now awaiting disbursement from the administrator.`,
        projectCode,
        statusText: "Approved by PI (Pending Payment)",
      },
    });

    // B. Notify Admin
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
    });

    const uploaderName = bill.user.name || "A team member";

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        title: "Bill Approved - Ready for Disbursement",
        message: `An expense bill of ${billAmountStr} for project ${projectCode} has been approved by the PI.`,
        type: "BILL_APPROVED_ADMIN",
        link: `/dashboard/grant/${grantId}`,
        emailParams: {
          badgeText: "Payment Ready",
          badgeType: "success",
          emailSubject: `Bill Approved & Ready for Disbursement: ${projectCode}`,
          heading: "Payment Ready for Disbursement",
          bodyText: `The expense bill of ${billAmountStr} uploaded by ${uploaderName} has been approved by the PI. The Master PDF has been regenerated and is ready for payment.`,
          projectCode,
          statusText: "Approved (Master PDF Updated)",
        },
      });
    }
  } catch (error) {
    console.error("Error in notifyBillAccepted:", error);
  }
}

// 5. Notify on Bill Rejected (Call this BEFORE deletion)
export async function notifyBillRejected(grantId: string, billId: string) {
  try {
    const bill = await prisma.grantInBill.findUnique({
      where: { id: billId },
      include: {
        user: true,
        grantIn: true,
      },
    });

    if (!bill) return;

    const projectCode = bill.grantIn.projectCode || "N/A";
    const billAmountStr = `INR ${bill.amount ? bill.amount.toLocaleString("en-IN") : "0"}`;

    await sendNotification({
      userId: bill.userId,
      email: bill.user.email,
      name: bill.user.name,
      title: "Expense Bill Declined",
      message: `Your expense bill of ${billAmountStr} for project ${projectCode} has been declined.`,
      type: "BILL_REJECTED",
      link: `/dashboard/grant/${grantId}`,
      emailParams: {
        badgeText: "Bill Declined",
        badgeType: "error",
        emailSubject: `Expense Bill Declined: ${projectCode}`,
        heading: "Expense Bill Declined",
        bodyText: `Your uploaded expense bill of amount ${billAmountStr} for project code ${projectCode} has been declined and removed by the project verifier. Please check if details were incorrect and re-upload if needed.`,
        projectCode,
        statusText: "Declined & Removed",
      },
    });
  } catch (error) {
    console.error("Error in notifyBillRejected:", error);
  }
}
