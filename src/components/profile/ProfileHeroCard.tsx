"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Mail,
  Phone,
  Pencil,
  Share2,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Link as LinkIcon,
  Github,
  Linkedin,
  Globe,
  Briefcase,
} from "lucide-react"
import Link from "next/link"

interface ProfileUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  bio: string | null
  department: string | null
  phone: string | null
  role: string
  profileCompleted: boolean
  coverImage?: string | null
  institution?: string | null
  linkedinLink?: string | null
  skills?: string[]
  enrollmentNo?: string | null
  degree?: string | null
  currentYear?: string | null
  currentSemester?: string | null
  graduationYear?: string | null
  resumeLink?: string | null
  portfolioLink?: string | null
  githubLink?: string | null
  researchInterests?: string[]
  designation?: string | null
  yearsOfExperience?: string | null
  areasOfExpertise?: string[]
  orcidId?: string | null
}

interface ProfileHeroCardProps {
  user: ProfileUser
  isOwnProfile: boolean
}

const roleConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  STUDENT: {
    label: "Student",
    icon: <GraduationCap className="h-3 w-3" />,
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  FACULTY: {
    label: "Faculty",
    icon: <BookOpen className="h-3 w-3" />,
    color: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  },
  ADMIN: {
    label: "Admin",
    icon: <ShieldCheck className="h-3 w-3" />,
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
}

export function ProfileHeroCard({ user, isOwnProfile }: ProfileHeroCardProps) {
  const initials = user.name ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "U"
  const role = roleConfig[user.role] ?? roleConfig.STUDENT

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: user.name ?? "Profile", url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const isStudent = user.role === "STUDENT"
  const isFaculty = user.role === "FACULTY" || user.role === "ADMIN"

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 backdrop-blur-md shadow-xl">
      {/* Cover gradient or Image — LinkedIn ratio 4:1 */}
      <div
        className="w-full relative bg-muted/30"
        style={{
          aspectRatio: "4/1",
          minHeight: "80px",
          maxHeight: "200px",
          ...((!user.coverImage) ? {
            background: "linear-gradient(135deg, oklch(0.18 0.06 115) 0%, oklch(0.12 0.035 115) 40%, oklch(0.09 0.02 115) 100%)",
          } : {}),
        }}
      >
        {user.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, #c9f53b 0%, transparent 60%), radial-gradient(circle at 80% 20%, #c9f53b 0%, transparent 40%)",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 mb-4">
          <div className="relative self-start sm:self-auto">
            <div className="absolute inset-0 rounded-full bg-[#c9f53b]/30 blur-xl scale-110 opacity-60" />
            <Avatar className="h-28 w-28 border-4 border-[#0c0c0c] bg-[#0c0c0c] shadow-2xl relative">
              <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} className="object-cover" />
              <AvatarFallback className="text-3xl font-bold bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-1 right-2 h-4 w-4 rounded-full bg-[#c9f53b] border-2 border-[#0c0c0c] shadow-sm" />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pb-1 self-start sm:self-auto">
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-muted-foreground hover:text-foreground border border-border/40 hover:border-[#c9f53b]/40 hover:bg-[#c9f53b]/5 transition-all">
              <Share2 className="h-4 w-4" /> Share
            </Button>
            {isOwnProfile && (
              <Button asChild size="sm" className="gap-1.5 bg-[#c9f53b] hover:bg-[#c9f53b]/90 text-black font-semibold transition-all">
                <Link href="/dashboard/profile">
                  <Pencil className="h-3.5 w-3.5" /> Edit Profile
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {user.name ?? "Unnamed User"}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${role.color}`}>
                  {role.icon} {role.label}
                </span>
                {user.orcidId && (
                  <a href={`https://orcid.org/${user.orcidId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#A6CE39]/10 text-[#A6CE39] hover:bg-[#A6CE39]/20 transition-colors border border-[#A6CE39]/20">
                    iD ORCID
                  </a>
                )}
              </div>
              
              {/* Primary Designation / Degree */}
              <div className="text-sm font-medium text-[#c9f53b] flex items-center gap-2 flex-wrap">
                {isFaculty && user.designation && <span>{user.designation}</span>}
                {isStudent && user.degree && <span>{user.degree}</span>}
                {((isFaculty && user.designation) || (isStudent && user.degree)) && user.department && <span className="text-muted-foreground">•</span>}
                {user.department && <span className="text-foreground">{user.department}</span>}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {user.institution && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {user.institution}
                </span>
              )}
              {user.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {user.phone}
                </span>
              )}
            </div>

            {/* Bio */}
            {user.bio ? (
              <p className="text-sm text-muted-foreground leading-relaxed mt-2 border-l-2 border-[#c9f53b]/30 pl-3">
                {user.bio}
              </p>
            ) : isOwnProfile && (
              <p className="text-sm text-muted-foreground/50 italic mt-2">
                No bio yet. <Link href="/dashboard/profile" className="text-[#c9f53b]/70 hover:text-[#c9f53b] underline-offset-4 hover:underline">Add one →</Link>
              </p>
            )}

            {/* Tags (Skills / Expertise) */}
            {(user.skills?.length || user.areasOfExpertise?.length || user.researchInterests?.length) ? (
              <div className="space-y-3 pt-2">
                {user.skills && user.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-muted/50 hover:bg-muted font-normal text-xs text-white">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {user.areasOfExpertise && user.areasOfExpertise.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expertise</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.areasOfExpertise.map((exp, i) => (
                        <Badge key={i} variant="outline" className="border-[#c9f53b]/30 text-[#c9f53b]/80 font-normal text-xs">{exp}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {user.researchInterests && user.researchInterests.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Research Interests</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.researchInterests.map((interest, i) => (
                        <Badge key={i} variant="outline" className="border-blue-500/30 text-blue-400 font-normal text-xs">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Right Sidebar Info */}
          <div className="space-y-5 lg:pl-6 lg:border-l border-border/20 pt-4 lg:pt-0">
            {/* Links */}
            {(user.linkedinLink || user.githubLink || user.portfolioLink || user.resumeLink) && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Links</span>
                <div className="flex flex-col gap-2">
                  {user.linkedinLink && (
                    <a href={user.linkedinLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-[#0a66c2] transition-colors">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                  {user.githubLink && (
                    <a href={user.githubLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors">
                      <Github className="h-4 w-4" /> GitHub
                    </a>
                  )}
                  {user.portfolioLink && (
                    <a href={user.portfolioLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-[#c9f53b] transition-colors">
                      <Globe className="h-4 w-4" /> Portfolio
                    </a>
                  )}
                  {user.resumeLink && (
                    <a href={user.resumeLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-[#c9f53b] transition-colors">
                      <LinkIcon className="h-4 w-4" /> Resume / CV
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Additional Academic Details */}
            {isStudent && (user.enrollmentNo || user.currentYear || user.currentSemester || user.graduationYear) && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Info</span>
                <div className="space-y-1.5 text-sm">
                  {user.enrollmentNo && <div className="flex justify-between"><span className="text-muted-foreground">ID:</span> <span className="font-medium">{user.enrollmentNo}</span></div>}
                  {user.currentYear && <div className="flex justify-between"><span className="text-muted-foreground">Year:</span> <span>{user.currentYear}</span></div>}
                  {user.currentSemester && <div className="flex justify-between"><span className="text-muted-foreground">Semester:</span> <span>{user.currentSemester}</span></div>}
                  {user.graduationYear && <div className="flex justify-between"><span className="text-muted-foreground">Graduating:</span> <span>{user.graduationYear}</span></div>}
                </div>
              </div>
            )}

            {/* Additional Professional Details */}
            {isFaculty && (user.yearsOfExperience) && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</span>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Total:</span>
                    <span className="font-medium">{user.yearsOfExperience}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
