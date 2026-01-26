import { ResearchStatus, JournalType } from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface JournalAuthor {
  id: string
  userId: string
  journalId: string
  user: User
}

export interface Journal {
  id: string
  serialNo: string
  titleOfJournal: string
  title: string
  journalType: JournalType
  impactFactor: number | null
  dateOfImpactFactor: Date | string | null
  journalPublisher: string | null
  status: ResearchStatus
  paperLink: string | null
  doi: string | null
  registrationFees: number | null
  reimbursement: number | null
  isPublic: boolean
  abstract: string | null
  imageUrl: string | null
  documentUrl: string | null
  publicationDate: Date | string | null
  keywords: string[]
  createdAt: Date | string
  updatedAt: Date | string
  studentAuthors: JournalAuthor[]
  facultyAuthors: JournalAuthor[]
}

export interface JournalListResponse {
  journals: Journal[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface JournalFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: ResearchStatus
  isPublic?: boolean
  journalType?: JournalType
  keyword?: string
  journalPublisher?: string
  search?: string
  createdFrom?: string
  createdTo?: string
  publishedFrom?: string
  publishedTo?: string
  minRegistrationFees?: number
  maxRegistrationFees?: number
  minReimbursement?: number
  maxReimbursement?: number
  minImpactFactor?: number
  maxImpactFactor?: number
  facultyAuthorIds?: string[]
  studentAuthorIds?: string[]
}

export interface CreateJournalInput {
  serialNo: string
  titleOfJournal: string
  title: string
  journalType: JournalType
  impactFactor?: number
  dateOfImpactFactor?: string | Date
  journalPublisher?: string
  status?: ResearchStatus
  paperLink?: string
  doi?: string
  registrationFees?: number
  reimbursement?: number
  isPublic?: boolean
  abstract?: string
  imageUrl?: string
  documentUrl?: string
  publicationDate?: string | Date
  keywords?: string[]
  studentAuthorIds?: string[]
  facultyAuthorIds?: string[]
}

export type UpdateJournalInput = Partial<CreateJournalInput>

export interface JournalStatsResponse {
  total: number
  publicCount: number
  privateCount: number
  statusCounts: Array<{
    status: ResearchStatus
    count: number
  }>
  typeCounts: Array<{
    type: JournalType
    count: number
  }>
  financials: {
    totalRegistrationFees: number
    totalReimbursement: number
    averageRegistrationFees: number
    averageReimbursement: number
    averageImpactFactor: number
  }
  recentJournals: Journal[]
}
