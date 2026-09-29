import prisma from "@/lib/prisma";
import { UserRole, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Common Select Objects for Consistency
// ─────────────────────────────────────────────────────────────

export const userBasicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  department: true,
  institution: true,
} as const;

export const userProfileSelect = {
  ...userBasicSelect,
  bio: true,
  phone: true,
  linkedinLink: true,
  githubLink: true,
  portfolioLink: true,
  resumeLink: true,
  skills: true,
  enrollmentNo: true,
  degree: true,
  currentYear: true,
  currentSemester: true,
  graduationYear: true,
  designation: true,
  yearsOfExperience: true,
  areasOfExpertise: true,
  researchInterests: true,
  orcidId: true,
  profileCompleted: true,
  emailVerified: true,
} as const;

export const authorSelect = {
  id: true,
  user: {
    select: userBasicSelect,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Filter Builders
// ─────────────────────────────────────────────────────────────

/**
 * Build WHERE clause for user's own resources vs. all resources
 * based on their role.
 */
export function buildOwnershipFilter(
  userId: string,
  userRole: UserRole,
  options: {
    studentAuthorField?: string;
    facultyAuthorField?: string;
    userIdField?: string;
  } = {}
): any {
  // EDITOR and above can see all
  if (["EDITOR", "ADMIN", "SUPERADMIN"].includes(userRole)) {
    return {};
  }

  // Build filter for user's own resources
  const filters: any[] = [];

  // Direct userId field (for Certificate, FDP, Achievement)
  if (options.userIdField) {
    filters.push({ [options.userIdField]: userId });
  }

  // Student author relation
  if (options.studentAuthorField) {
    filters.push({
      [options.studentAuthorField]: {
        some: { userId },
      },
    });
  }

  // Faculty author relation
  if (options.facultyAuthorField) {
    filters.push({
      [options.facultyAuthorField]: {
        some: { userId },
      },
    });
  }

  return filters.length > 0 ? { OR: filters } : {};
}

/**
 * Build visibility filter for public endpoints
 */
export function buildPublicFilter(statusField: string = "status"): any {
  return {
    isPublic: true,
    [statusField]: {
      in: ["APPROVED", "PUBLISHED", "GRANTED", "PRESENTED"],
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Research Resource Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Check if user is an author of a research resource
 */
export async function isUserAuthor(
  resourceType:
    | "journal"
    | "bookChapter"
    | "conference"
    | "patent"
    | "copyright"
    | "grantIn",
  resourceId: string,
  userId: string
): Promise<boolean> {
  switch (resourceType) {
    case "journal": {
      const resource = await prisma.journal.findUnique({
        where: { id: resourceId },
        select: {
          studentAuthors: { where: { userId }, select: { id: true } },
          facultyAuthors: { where: { userId }, select: { id: true } },
        },
      });
      return (
        (resource?.studentAuthors.length ?? 0) > 0 ||
        (resource?.facultyAuthors.length ?? 0) > 0
      );
    }

    case "bookChapter": {
      const resource = await prisma.bookChapter.findUnique({
        where: { id: resourceId },
        select: {
          studentAuthors: { where: { userId }, select: { id: true } },
          facultyAuthors: { where: { userId }, select: { id: true } },
        },
      });
      return (
        (resource?.studentAuthors.length ?? 0) > 0 ||
        (resource?.facultyAuthors.length ?? 0) > 0
      );
    }

    case "conference": {
      const resource = await prisma.conference.findUnique({
        where: { id: resourceId },
        select: {
          studentAuthors: { where: { userId }, select: { id: true } },
          facultyAuthors: { where: { userId }, select: { id: true } },
        },
      });
      return (
        (resource?.studentAuthors.length ?? 0) > 0 ||
        (resource?.facultyAuthors.length ?? 0) > 0
      );
    }

    case "patent": {
      const resource = await prisma.patent.findUnique({
        where: { id: resourceId },
        select: {
          studentAuthors: { where: { userId }, select: { id: true } },
          facultyAuthors: { where: { userId }, select: { id: true } },
        },
      });
      return (
        (resource?.studentAuthors.length ?? 0) > 0 ||
        (resource?.facultyAuthors.length ?? 0) > 0
      );
    }

    case "copyright": {
      const resource = await prisma.copyright.findUnique({
        where: { id: resourceId },
        select: {
          studentAuthors: { where: { userId }, select: { id: true } },
          facultyAuthors: { where: { userId }, select: { id: true } },
        },
      });
      return (
        (resource?.studentAuthors.length ?? 0) > 0 ||
        (resource?.facultyAuthors.length ?? 0) > 0
      );
    }

    case "grantIn": {
      const resource = await prisma.grantIn.findUnique({
        where: { id: resourceId },
        select: {
          studentAuthors: { where: { userId }, select: { id: true } },
          facultyAuthors: { where: { userId }, select: { id: true } },
        },
      });
      return (
        (resource?.studentAuthors.length ?? 0) > 0 ||
        (resource?.facultyAuthors.length ?? 0) > 0
      );
    }

    default:
      return false;
  }
}

/**
 * Check if user owns a direct resource (Certificate, FDP, Achievement)
 */
export async function isUserOwner(
  resourceType: "certificate" | "fdp" | "achievement",
  resourceId: string,
  userId: string
): Promise<boolean> {
  switch (resourceType) {
    case "certificate": {
      const resource = await prisma.certificate.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return resource?.userId === userId;
    }

    case "fdp": {
      const resource = await prisma.fDP.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return resource?.userId === userId;
    }

    case "achievement": {
      const resource = await prisma.achievement.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return resource?.userId === userId;
    }

    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Notification Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Create a notification for a user
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  return prisma.notification.create({
    data,
  });
}

/**
 * Notify all authors of a research resource
 */
export async function notifyAuthors(
  resourceType:
    | "journal"
    | "bookChapter"
    | "conference"
    | "patent"
    | "copyright"
    | "grantIn",
  resourceId: string,
  notification: {
    title: string;
    message: string;
    type: string;
    link?: string;
  }
) {
  const resource = await getResourceWithAuthors(resourceType, resourceId);
  if (!resource) return;

  const userIds = new Set<string>();

  // Collect all user IDs
  if ("studentAuthors" in resource) {
    resource.studentAuthors.forEach((author: any) => {
      if (author.userId) userIds.add(author.userId);
    });
  }

  if ("facultyAuthors" in resource) {
    resource.facultyAuthors.forEach((author: any) => {
      if (author.userId) userIds.add(author.userId);
    });
  }

  // Create notifications for all authors
  const notifications = Array.from(userIds).map((userId) => ({
    userId,
    ...notification,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}

async function getResourceWithAuthors(
  resourceType: string,
  resourceId: string
): Promise<any> {
  const select = {
    studentAuthors: { select: { userId: true } },
    facultyAuthors: { select: { userId: true } },
  };

  switch (resourceType) {
    case "journal":
      return prisma.journal.findUnique({ where: { id: resourceId }, select });
    case "bookChapter":
      return prisma.bookChapter.findUnique({
        where: { id: resourceId },
        select,
      });
    case "conference":
      return prisma.conference.findUnique({
        where: { id: resourceId },
        select,
      });
    case "patent":
      return prisma.patent.findUnique({ where: { id: resourceId }, select });
    case "copyright":
      return prisma.copyright.findUnique({ where: { id: resourceId }, select });
    case "grantIn":
      return prisma.grantIn.findUnique({ where: { id: resourceId }, select });
    default:
      return null;
  }
}
