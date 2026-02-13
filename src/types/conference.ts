import { ConferenceStatus, TeacherStatus, ConferenceMode } from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface ConferenceAuthor {
  id: string
  userId: string
  conferenceId: string
  user: User
}

export interface Conference {
  id: string
  conferenceName: string
  paperName: string | null
  abstract: string | null
  mode: ConferenceMode
  imageUrl: string | null
  documentUrl: string | null
  conferenceStatus: ConferenceStatus
  teacherStatus: TeacherStatus
  registrationFees: number | null
  reimbursement: number | null
  isPublic: boolean
  keywords: string[]
  paperDoi: string | null
  paperLink: string | null
  conferenceDate: Date | string | null
  conferencePublisher: string | null
  createdAt: Date | string
  updatedAt?: Date | string
  studentAuthors: ConferenceAuthor[]
  facultyAuthors: ConferenceAuthor[]
}

export interface ConferenceListResponse {
  conferences: Conference[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ConferenceFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  conferenceStatus?: ConferenceStatus
  teacherStatus?: TeacherStatus
  isPublic?: boolean
  keyword?: string
  conferenceName?: string // publisher equivalent
  search?: string
  mode?: ConferenceMode
  minDate?: string // conferenceDate
  maxDate?: string // conferenceDate
  minRegistrationFees?: number
  maxRegistrationFees?: number
  minReimbursement?: number
  maxReimbursement?: number
  facultyAuthorIds?: string[]
  studentAuthorIds?: string[]
}

export interface CreateConferenceInput {
  conferenceName: string
  paperName?: string
  abstract?: string
  mode?: ConferenceMode
  imageUrl?: string
  documentUrl?: string
  conferenceStatus?: ConferenceStatus
  teacherStatus?: TeacherStatus
  registrationFees?: number
  reimbursement?: number
  isPublic?: boolean
  keywords?: string[]
  paperDoi?: string
  paperLink?: string
  conferenceDate?: string | Date
  conferencePublisher?: string
  studentAuthorIds?: string[]
  facultyAuthorIds?: string[]
}

export type UpdateConferenceInput = Partial<CreateConferenceInput>

export interface ConferenceStatsResponse {
  total: number
  publicCount: number
  privateCount: number
  conferenceStatusCounts: Array<{
    status: ConferenceStatus
    count: number
  }>
  monthlyTrend: Array<{ month: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
  weeklyTrend: Array<{ week: string; count: number }>
  financials: {
    totalRegistrationFees: number
    avgRegistrationFees: number
    totalReimbursement: number
    avgReimbursement: number
  }
}

export interface BulkDeleteResponse {
  count: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}
