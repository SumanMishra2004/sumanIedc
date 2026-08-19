"use client"

import {
  BookOpen,
  FileText,
  Microscope,
  Award,
  Copyright,
  ScrollText,
  GraduationCap,
  LayoutGrid,
  Trophy,
} from "lucide-react"

interface Stats {
  total: number
  journals: number
  bookChapters: number
  conferences: number
  patents: number
  copyrights: number
  certificates: number
  fdps: number
  achievements: number
}

interface ProfileStatsRowProps {
  stats: Stats
  userRole: string
}

export function ProfileStatsRow({ stats, userRole }: ProfileStatsRowProps) {
  const statCards = [
    {
      label: "Total Publications",
      value: stats.total,
      icon: <LayoutGrid className="h-5 w-5" />,
      accent: "#c9f53b",
      bg: "from-[#c9f53b]/10 to-transparent",
    },
    {
      label: "Journals",
      value: stats.journals,
      icon: <FileText className="h-5 w-5" />,
      accent: "#60a5fa",
      bg: "from-blue-500/10 to-transparent",
    },
    {
      label: "Book Chapters",
      value: stats.bookChapters,
      icon: <BookOpen className="h-5 w-5" />,
      accent: "#a78bfa",
      bg: "from-violet-500/10 to-transparent",
    },
    {
      label: "Conferences",
      value: stats.conferences,
      icon: <Microscope className="h-5 w-5" />,
      accent: "#f472b6",
      bg: "from-pink-500/10 to-transparent",
    },
    {
      label: "Patents",
      value: stats.patents,
      icon: <ScrollText className="h-5 w-5" />,
      accent: "#fb923c",
      bg: "from-orange-500/10 to-transparent",
    },
    {
      label: "Copyrights",
      value: stats.copyrights,
      icon: <Copyright className="h-5 w-5" />,
      accent: "#34d399",
      bg: "from-emerald-500/10 to-transparent",
    },
    {
      label: "Certificates",
      value: stats.certificates,
      icon: <Award className="h-5 w-5" />,
      accent: "#fbbf24",
      bg: "from-amber-500/10 to-transparent",
    },
    {
      label: "Achievements",
      value: stats.achievements,
      icon: <Trophy className="h-5 w-5" />,
      accent: "#ef4444",
      bg: "from-red-500/10 to-transparent",
    },
    ...(userRole === "FACULTY" || userRole === "ADMIN" || userRole === "EDITOR" || userRole === "SUPERADMIN"
      ? [
          {
            label: "FDPs",
            value: stats.fdps,
            icon: <GraduationCap className="h-5 w-5" />,
            accent: "#e879f9",
            bg: "from-fuchsia-500/10 to-transparent",
          },
        ]
      : []),
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
      {statCards.map((card) => (
        <div
          key={card.label}
          className={`group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b ${card.bg} bg-card/60 backdrop-blur-sm p-4 transition-all duration-300 hover:border-[${card.accent}]/30 hover:shadow-lg hover:-translate-y-0.5 cursor-default`}
        >
          {/* Glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
            style={{
              background: `radial-gradient(ellipse at top left, ${card.accent}15, transparent 70%)`,
            }}
          />
          <div className="relative z-10">
            <div
              className="mb-2 inline-flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ background: `${card.accent}18`, color: card.accent }}
            >
              {card.icon}
            </div>
            <div
              className="text-2xl font-bold tabular-nums"
              style={{ color: card.accent }}
            >
              {card.value}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium leading-tight">
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
