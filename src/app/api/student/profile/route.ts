import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  withAuth,
  successResponse,
  updatedResponse,
  handleApiError,
} from "@/lib/api";

// GET /api/student/profile
export const GET = withAuth(async ({ user }) => {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        coverImage: true,
        bio: true,
        department: true,
        phone: true,
        institution: true,
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
        profileCompleted: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
});

// PATCH /api/student/profile
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  bio: z.string().max(1000).optional(),
  department: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  institution: z.string().max(200).optional(),
  linkedinLink: z.string().url().optional(),
  githubLink: z.string().url().optional(),
  portfolioLink: z.string().url().optional(),
  resumeLink: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  enrollmentNo: z.string().max(50).optional(),
  degree: z.string().max(100).optional(),
  currentYear: z.number().int().min(1).max(10).optional(),
  currentSemester: z.number().int().min(1).max(20).optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
});

export const PATCH = withAuth(async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    // Check if profile is complete
    const profileCompleted = !!(
      validated.name &&
      validated.department &&
      validated.institution &&
      validated.enrollmentNo &&
      validated.degree
    );

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...validated,
        ...(profileCompleted !== undefined && { profileCompleted }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        coverImage: true,
        bio: true,
        department: true,
        phone: true,
        institution: true,
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
        profileCompleted: true,
      },
    });

    return updatedResponse(profile, "Profile updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
