import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileForm } from "./ProfileForm"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, bio: true, department: true, phone: true, image: true, role: true,
      coverImage: true, institution: true, linkedinLink: true, skills: true,
      enrollmentNo: true, degree: true, currentYear: true, currentSemester: true, graduationYear: true,
      resumeLink: true, portfolioLink: true, githubLink: true, researchInterests: true,
      designation: true, yearsOfExperience: true, areasOfExpertise: true, orcidId: true
    }
  })

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto p-4 md:p-6 w-full space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account profile, bio, department, and contact information.
        </p>
      </div>
      <ProfileForm user={user} />
    </div>
  )
}
