"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { setupProfileAction } from "@/lib/actions/auth"
import { uploadFile } from "@/lib/appwrite"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

import {
  Loader2, Upload, Camera, Github, Linkedin, Globe, FileText,
  GraduationCap, Briefcase, User, Phone, BookOpen, ChevronRight,
  FlaskConical, BadgeCheck, Link2
} from "lucide-react"

interface ProfileFormProps {
  user: {
    id: string
    role: string
    name: string | null
    email: string | null
    bio: string | null
    department: string | null
    phone: string | null
    image: string | null
    coverImage: string | null
    institution: string | null
    linkedinLink: string | null
    skills: string[]
    enrollmentNo: string | null
    degree: string | null
    currentYear: string | null
    currentSemester: string | null
    graduationYear: string | null
    resumeLink: string | null
    portfolioLink: string | null
    githubLink: string | null
    researchInterests: string[]
    designation: string | null
    yearsOfExperience: string | null
    areasOfExpertise: string[]
    orcidId: string | null
  }
}

// ── Reusable section header ──────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  label,
  badge,
  iconColor = "text-[#c9f53b]",
  iconBg = "bg-[#c9f53b]/10",
}: {
  icon: React.ElementType
  label: string
  badge?: string
  iconColor?: string
  iconBg?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${iconBg} flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/60">
        {label}
      </p>
      {badge && (
        <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-medium">
          {badge}
        </Badge>
      )}
      <Separator className="flex-1 bg-border/30" />
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  tooltip,
  children,
  full,
}: {
  label: string
  tooltip?: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={`space-y-2 ${full ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-1.5">
        <Label className="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/55">
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
                  <BadgeCheck className="w-3 h-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-56">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Input with optional leading icon ─────────────────────────────────────────
function IconInput({
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ElementType }) {
  const base =
    "bg-[#111] border-white/[0.07] focus-visible:border-[#c9f53b]/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10 rounded-lg transition-colors placeholder:text-muted-foreground/25"
  if (!Icon) return <Input className={`${base} ${className ?? ""}`} {...props} />
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 pointer-events-none" />
      <Input className={`${base} pl-9 ${className ?? ""}`} {...props} />
    </div>
  )
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { update } = useSession()
  const { toast } = useToast()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string | null>(
    user.resumeLink ? decodeURIComponent(user.resumeLink.split("/").pop()?.split("?")[0] ?? "resume") : null
  )

  // Common
  const [name, setName] = useState(user.name ?? "")
  const [bio, setBio] = useState(user.bio ?? "")
  const [department, setDepartment] = useState(user.department ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [image, setImage] = useState(user.image ?? "")
  const [coverImage, setCoverImage] = useState(user.coverImage ?? "")
  const [institution, setInstitution] = useState(user.institution ?? "")
  const [linkedinLink, setLinkedinLink] = useState(user.linkedinLink ?? "")
  const [githubLink, setGithubLink] = useState(user.githubLink ?? "")  // all roles
  const [skills, setSkills] = useState(user.skills.join(", "))

  // Student
  const [enrollmentNo, setEnrollmentNo] = useState(user.enrollmentNo ?? "")
  const [degree, setDegree] = useState(user.degree ?? "")
  const [currentYear, setCurrentYear] = useState(user.currentYear ?? "")
  const [currentSemester, setCurrentSemester] = useState(user.currentSemester ?? "")
  const [graduationYear, setGraduationYear] = useState(user.graduationYear ?? "")
  const [resumeLink, setResumeLink] = useState(user.resumeLink ?? "")
  const [portfolioLink, setPortfolioLink] = useState(user.portfolioLink ?? "")
  const [researchInterests, setResearchInterests] = useState(user.researchInterests.join(", "))

  // Faculty
  const [designation, setDesignation] = useState(user.designation ?? "")
  const [yearsOfExperience, setYearsOfExperience] = useState(user.yearsOfExperience ?? "")
  const [areasOfExpertise, setAreasOfExpertise] = useState(user.areasOfExpertise.join(", "))
  const [orcidId, setOrcidId] = useState(user.orcidId ?? "")
  const [facultyResearchInterests, setFacultyResearchInterests] = useState(user.researchInterests.join(", "))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const url = await uploadFile(file)
      setImage(url)
      toast({ title: "Photo updated" })
    } catch {
      toast({ title: "Upload failed", variant: "destructive" })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingCover(true)
    try {
      const url = await uploadFile(file)
      setCoverImage(url)
      toast({ title: "Cover updated" })
    } catch {
      toast({ title: "Upload failed", variant: "destructive" })
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or Word document.", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5 MB.", variant: "destructive" })
      return
    }
    setIsUploadingResume(true)
    try {
      const url = await uploadFile(file)
      setResumeLink(url)
      setResumeFileName(file.name)
      toast({ title: "Resume uploaded" })
    } catch {
      toast({ title: "Upload failed", variant: "destructive" })
    } finally {
      setIsUploadingResume(false)
      if (resumeInputRef.current) resumeInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set("image", image)
      formData.set("coverImage", coverImage)
      const result = await setupProfileAction(formData)
      if ("error" in result) {
        toast({ title: "Update failed", description: result.error, variant: "destructive" })
      } else {
        await update({ name, image: image || undefined, profileCompleted: true })
        toast({ title: "Profile saved successfully" })
        router.push("/dashboard")
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const initials = name
    ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"
  const isStudent = user.role === "STUDENT"
  const isFaculty = user.role === "FACULTY"
  const busy = isLoading || isUploadingImage || isUploadingCover || isUploadingResume

  const inputBase =
    "bg-[#111] border-white/[0.07] focus-visible:border-[#c9f53b]/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10 rounded-lg transition-colors placeholder:text-muted-foreground/25"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── COVER + AVATAR HERO ─────────────────────────────────────────── */}
      <Card className="border-white/[0.06] bg-[#0d0d0d] overflow-hidden p-0">
        {/* Cover photo */}
        <div className="relative h-44 md:h-56 group">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  "radial-gradient(ellipse 90% 70% at 50% -10%, rgba(201,245,59,0.1) 0%, transparent 65%), linear-gradient(170deg,#131313 0%,#0a0a0a 100%)",
              }}
            >
              {/* Subtle grid */}
              <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,0.05) 28px,rgba(255,255,255,0.05) 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,255,255,0.05) 28px,rgba(255,255,255,0.05) 29px)",
                }}
              />
              {/* Accent dot cluster */}
              <div className="absolute bottom-4 left-6 w-32 h-20 opacity-20"
                style={{ background: "radial-gradient(circle at 30% 60%, #c9f53b44 0%, transparent 60%)" }} />
            </div>
          )}

          {isUploadingCover && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 text-sm text-white/60 backdrop-blur-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#c9f53b]" />
              Uploading cover…
            </div>
          )}

          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" disabled={busy} />

          {/* Hover controls */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button" size="sm" variant="secondary"
              className="h-8 px-3 bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur-sm text-xs gap-1.5"
              onClick={() => coverInputRef.current?.click()} disabled={busy}
            >
              <Camera className="w-3.5 h-3.5" /> Change cover
            </Button>
            {coverImage && (
              <Button
                type="button" size="sm" variant="destructive"
                className="h-8 px-3 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 backdrop-blur-sm text-xs"
                onClick={() => setCoverImage("")} disabled={busy}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        {/* Avatar + quick actions */}
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
            {/* Avatar */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="relative group/av flex-shrink-0 cursor-pointer"
                    onClick={() => !busy && fileInputRef.current?.click()}
                  >
                    <Avatar className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] border-[3px] border-[#0d0d0d] ring-1 ring-white/10">
                      <AvatarImage src={image} alt={name} className="object-cover" />
                      <AvatarFallback className="bg-[#1c1c1c] text-base font-semibold text-muted-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isUploadingImage ? (
                      <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-[#c9f53b]" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover/av:opacity-100 transition-opacity">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Click to change photo</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={busy} />

            {/* Role badge + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:mb-2 flex-wrap">
              <Badge
                variant="outline"
                className={`w-fit text-[10px] font-semibold tracking-wider uppercase border px-2.5 py-0.5
                  ${isStudent ? "border-blue-500/30 text-blue-400 bg-blue-500/8"
                    : isFaculty ? "border-violet-500/30 text-violet-400 bg-violet-500/8"
                    : "border-white/15 text-white/50"}`}
              >
                {user.role}
              </Badge>

              <Button
                type="button" variant="outline" size="sm"
                className="h-8 px-3 text-xs border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20 text-muted-foreground hover:text-white gap-1.5"
                onClick={() => fileInputRef.current?.click()} disabled={busy}
              >
                <Upload className="w-3.5 h-3.5" /> Upload photo
              </Button>

              {image && (
                <Button
                  type="button" variant="ghost" size="sm"
                  className="h-8 px-3 text-xs text-red-500/60 hover:text-red-400 hover:bg-red-500/8"
                  onClick={() => setImage("")} disabled={busy}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── FORM SECTIONS ──────────────────────────────────────────────── */}
      <Card className="border-white/[0.06] bg-[#0d0d0d]">
        <CardContent className="p-0 divide-y divide-white/[0.05]">

          {/* ── BASIC INFO ─────────────────────────────────────────────── */}
          <section className="p-6 md:p-8">
            <SectionHeader icon={User} label="Basic information" />
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                <Field label="Full name *">
                  <Input
                    name="name" value={name} onChange={e => setName(e.target.value)}
                    required disabled={isLoading} className={inputBase}
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Email address">
                  <Input
                    value={user.email ?? ""} disabled
                    className={`${inputBase} opacity-40 cursor-not-allowed`}
                  />
                </Field>

                <Field label="Department">
                  <Input
                    name="department" value={department} onChange={e => setDepartment(e.target.value)}
                    disabled={isLoading} className={inputBase} placeholder="e.g. Computer Science"
                  />
                </Field>

                <Field label="Institution">
                  <Input
                    name="institution" value={institution} onChange={e => setInstitution(e.target.value)}
                    disabled={isLoading} className={inputBase} placeholder="University or college name"
                  />
                </Field>

                <Field label="Phone">
                  <IconInput
                    icon={Phone} name="phone" type="tel" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={isLoading} placeholder="+91 00000 00000"
                  />
                </Field>

              </div>

              <Field label="Bio / About me" full>
                <Textarea
                  name="bio" value={bio} onChange={e => setBio(e.target.value)}
                  disabled={isLoading} rows={3}
                  className="bg-[#111] border-white/[0.07] focus-visible:border-[#c9f53b]/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm rounded-lg resize-none transition-colors placeholder:text-muted-foreground/25"
                  placeholder="A short summary about yourself, your research, or interests…"
                />
              </Field>

              <Field label="Skills (comma separated)" full>
                <Input
                  name="skills" value={skills} onChange={e => setSkills(e.target.value)}
                  disabled={isLoading} className={inputBase}
                  placeholder="React, TypeScript, Machine Learning, Python…"
                />
              </Field>
            </div>
          </section>

          {/* ── STUDENT ACADEMIC ───────────────────────────────────────── */}
          {isStudent && (
            <section className="p-6 md:p-8">
              <SectionHeader
                icon={GraduationCap} label="Academic details"
                badge="Student"
                iconColor="text-blue-400" iconBg="bg-blue-500/10"
              />
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Enrollment number">
                    <Input
                      name="enrollmentNo" value={enrollmentNo} onChange={e => setEnrollmentNo(e.target.value)}
                      disabled={isLoading} className={inputBase}
                    />
                  </Field>
                  <Field label="Degree">
                    <Input
                      name="degree" value={degree} onChange={e => setDegree(e.target.value)}
                      disabled={isLoading} className={inputBase} placeholder="B.Tech, M.Sc, PhD…"
                    />
                  </Field>
                  <Field label="Current year">
                    <Input
                      name="currentYear" value={currentYear} onChange={e => setCurrentYear(e.target.value)}
                      disabled={isLoading} className={inputBase} placeholder="3rd Year"
                    />
                  </Field>
                  <Field label="Current semester">
                    <Input
                      name="currentSemester" value={currentSemester} onChange={e => setCurrentSemester(e.target.value)}
                      disabled={isLoading} className={inputBase} placeholder="6th Sem"
                    />
                  </Field>
                  <Field label="Graduation year">
                    <Input
                      name="graduationYear" value={graduationYear} onChange={e => setGraduationYear(e.target.value)}
                      disabled={isLoading} className={inputBase} placeholder="2026"
                    />
                  </Field>
                </div>
                <Field label="Research interests (comma separated)" full>
                  <IconInput
                    icon={FlaskConical} name="researchInterests" value={researchInterests}
                    onChange={e => setResearchInterests(e.target.value)}
                    disabled={isLoading} placeholder="NLP, Computer Vision, Robotics…"
                  />
                </Field>
              </div>
            </section>
          )}

          {/* ── FACULTY PROFESSIONAL ───────────────────────────────────── */}
          {isFaculty && (
            <section className="p-6 md:p-8">
              <SectionHeader
                icon={Briefcase} label="Professional details"
                badge="Faculty"
                iconColor="text-violet-400" iconBg="bg-violet-500/10"
              />
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Designation">
                    <Input
                      name="designation" value={designation} onChange={e => setDesignation(e.target.value)}
                      disabled={isLoading} className={inputBase} placeholder="Assistant Professor"
                    />
                  </Field>
                  <Field
                    label="Years of experience"
                    tooltip="Total years in academia or industry"
                  >
                    <Input
                      name="yearsOfExperience" value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)}
                      disabled={isLoading} className={inputBase} placeholder="e.g. 8"
                    />
                  </Field>
                  <Field
                    label="ORCID ID"
                    tooltip="Open Researcher and Contributor ID — a unique identifier for researchers"
                  >
                    <IconInput
                      icon={BadgeCheck} name="orcidId" value={orcidId}
                      onChange={e => setOrcidId(e.target.value)}
                      disabled={isLoading} placeholder="0000-0000-0000-0000"
                    />
                  </Field>
                </div>
                <Field label="Areas of expertise (comma separated)" full>
                  <Input
                    name="areasOfExpertise" value={areasOfExpertise} onChange={e => setAreasOfExpertise(e.target.value)}
                    disabled={isLoading} className={inputBase} placeholder="Machine Learning, Algorithms, HCI…"
                  />
                </Field>
                <Field label="Research interests (comma separated)" full>
                  <IconInput
                    icon={FlaskConical} name="researchInterests" value={facultyResearchInterests}
                    onChange={e => setFacultyResearchInterests(e.target.value)}
                    disabled={isLoading} placeholder="Deep Learning, NLP, Computational Biology…"
                  />
                </Field>
              </div>
            </section>
          )}

          {/* ── LINKS & PROFILES ───────────────────────────────────────── */}
          <section className="p-6 md:p-8">
            <SectionHeader icon={BookOpen} label="Links & profiles" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

              {/* LinkedIn — all roles */}
              <Field label="LinkedIn">
                <IconInput
                  icon={Linkedin} name="linkedinLink" type="url" value={linkedinLink}
                  onChange={e => setLinkedinLink(e.target.value)}
                  disabled={isLoading} placeholder="https://linkedin.com/in/…"
                />
              </Field>

              {/* GitHub — all roles */}
              <Field label="GitHub">
                <IconInput
                  icon={Github} name="githubLink" type="url" value={githubLink}
                  onChange={e => setGithubLink(e.target.value)}
                  disabled={isLoading} placeholder="https://github.com/…"
                />
              </Field>

              {/* Student-only links */}
              {isStudent && (
                <>
                  <Field label="Portfolio website">
                    <IconInput
                      icon={Globe} name="portfolioLink" type="url" value={portfolioLink}
                      onChange={e => setPortfolioLink(e.target.value)}
                      disabled={isLoading} placeholder="https://yoursite.com"
                    />
                  </Field>
                  <Field label="Resume / CV">
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleResumeChange}
                      className="hidden"
                      disabled={busy}
                    />
                    {/* Store the URL in a hidden input so FormData picks it up */}
                    <input type="hidden" name="resumeLink" value={resumeLink} />

                    {resumeLink && resumeFileName ? (
                      /* ── Uploaded state ── */
                      <div className="flex items-center gap-3 h-10 px-3 rounded-lg border border-white/[0.07] bg-[#111]">
                        <FileText className="w-4 h-4 text-[#c9f53b] flex-shrink-0" />
                        <a
                          href={resumeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-white/70 hover:text-white truncate transition-colors"
                          title={resumeFileName}
                        >
                          {resumeFileName}
                        </a>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-white hover:bg-white/8"
                                  onClick={() => resumeInputRef.current?.click()}
                                  disabled={busy}
                                >
                                  {isUploadingResume
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Upload className="w-3.5 h-3.5" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Replace file</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500/40 hover:text-red-400 hover:bg-red-500/8"
                                  onClick={() => { setResumeLink(""); setResumeFileName(null) }}
                                  disabled={busy}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                    <path d="M18 6 6 18M6 6l12 12"/>
                                  </svg>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Remove</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ) : (
                      /* ── Empty / upload state ── */
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 border-dashed border-white/[0.12] bg-transparent hover:bg-white/[0.03] hover:border-[#c9f53b]/30 text-muted-foreground/50 hover:text-white transition-all gap-2 justify-center"
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={busy}
                      >
                        {isUploadingResume ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#c9f53b]" />
                            <span className="text-sm">Uploading…</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Upload PDF or Word doc</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1 font-normal">
                              max 5 MB
                            </Badge>
                          </>
                        )}
                      </Button>
                    )}
                  </Field>
                </>
              )}

            </div>
          </section>

        </CardContent>
      </Card>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          type="button" variant="outline"
          className="border-white/[0.08] bg-transparent hover:bg-white/[0.04] hover:border-white/15 text-muted-foreground hover:text-white transition-colors"
          onClick={() => router.push("/dashboard")} disabled={busy}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          className="bg-[#c9f53b] text-black font-semibold hover:bg-[#d4f84f] active:bg-[#b8e030] transition-colors gap-2 disabled:opacity-50"
          disabled={busy}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Save changes
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}