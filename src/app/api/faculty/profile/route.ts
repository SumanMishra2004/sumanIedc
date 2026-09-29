import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { withRole, successResponse, updatedResponse, handleApiError } from "@/lib/api";

const updateFacultyProfileSchema = z.object({
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
  designation: z.string().max(200).optional(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  areasOfExpertise: z.array(z.string()).optional(),
  researchInterests: z.array(z.string()).optional(),
  orcidId: z.string().max(50).optional(),
});

// GET /api/faculty/profile
export const GET = withRole("FACULTY", async ({ user }) => {
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
        designation: true,
        yearsOfExperience: true,
        areasOfExpertise: true,
        researchInterests: true,
        orcidId: true,
        profileCompleted: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return successResponse(profile);
  } catch (error) { return handleApiError(error); }
});

// PATCH /api/faculty/profile
export const PATCH = withRole("FACULTY", async ({ user, req }) => {
  try {
    const body = await req.json();
    const validated = updateFacultyProfileSchema.parse(body);

    const profileCompleted = !!(
      validated.name &&
      validated.department &&
      validated.institution &&
      validated.designation
    );

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: { ...validated, ...(profileCompleted && { profileCompleted }) },
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
        designation: true,
        yearsOfExperience: true,
        areasOfExpertise: true,
        researchInterests: true,
        orcidId: true,
        profileCompleted: true,
      },
    });

    return updatedResponse(profile, "Profile updated successfully");
  } catch (error) { return handleApiError(error); }
});
