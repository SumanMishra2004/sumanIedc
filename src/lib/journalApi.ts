import axios, { AxiosError } from 'axios'
import {
  Journal,
  JournalListResponse,
  JournalFilters,
  CreateJournalInput,
} from '@/types/journal'

const API_BASE_URL = '/api/research/journal'

// Common types
export interface UpdateJournalInput {
  serialNo?: string
  title?: string
  journalName?: string
  imageUrl?: string
  documentUrl?: string
  abstract?: string
  scope?: string
  reviewType?: string
  accessType?: string
  indexing?: string
  quartile?: string
  publicationMode?: string
  impactFactor?: number
  impactFactorDate?: string | Date
  publisher?: string
  teacherStatus?: string
  paperLink?: string
  doi?: string
  registrationFees?: number
  reimbursement?: number
  isPublic?: boolean
  publicationDate?: string | Date
  keywords?: string[]
  studentAuthorIds?: string[]
  facultyAuthorIds?: string[]
}

export interface JournalStatsResponse {
  userRole: string
  total: number
  publicCount: number
  privateCount: number
  statusCounts: Array<{ status: string; count: number }>
  journalStatusCounts: Array<{ status: string; count: number }>
  scopeCounts: Array<{ scope: string; count: number }>
  indexingCounts: Array<{ indexing: string; count: number }>
  financials: {
    totalRegistrationFees: number
    totalReimbursement: number
    avgRegistrationFees: number
    avgReimbursement: number
    avgImpactFactor: number
  }
  monthlyTrend: Array<{ month: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
  weeklyTrend: Array<{ week: string; count: number }>
  recentJournals: Array<{ 
    id: string
    title: string
    journalName?: string
    scope: string
    indexing: string
    teacherStatus: string
    impactFactor: number | null
    createdAt: string
  }>
}

export interface BulkDeleteResponse {
  message: string
  count: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

// Error handler
const handleApiError = (error: unknown): { error: string } => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>
    return {
      error: axiosError.response?.data?.error || 
             axiosError.response?.data?.message || 
             axiosError.message ||
             'An unexpected error occurred'
    }
  }
  return { error: 'An unexpected error occurred' }
}

/**
 * Get list of journals with filters and pagination
 */
export const getJournals = async (
  filters?: JournalFilters
): Promise<ApiResponse<JournalListResponse>> => {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await axios.get<JournalListResponse>(
      `${API_BASE_URL}?${params.toString()}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get a single journal by ID
 */
export const getJournalById = async (
  id: string
): Promise<ApiResponse<{ journal: Journal }>> => {
  try {
    const response = await axios.get<{ journal: Journal }>(
      `${API_BASE_URL}/${id}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Create a new journal
 */
export const createJournal = async (
  data: CreateJournalInput
): Promise<ApiResponse<{ journal: Journal }>> => {
  try {
    const response = await axios.post<{ journal: Journal }>(
      API_BASE_URL,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Update an existing journal
 */
export const updateJournal = async (
  id: string,
  data: UpdateJournalInput
): Promise<ApiResponse<{ journal: Journal }>> => {
  try {
    const response = await axios.patch<{ journal: Journal }>(
      `${API_BASE_URL}/${id}`,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Delete a single journal
 */
export const deleteJournal = async (
  id: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await axios.delete<{ message: string }>(
      `${API_BASE_URL}/${id}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Bulk delete journals
 */
export const bulkDeleteJournals = async (
  ids: string[]
): Promise<ApiResponse<BulkDeleteResponse>> => {
  try {
    const response = await axios.delete<BulkDeleteResponse>(
      API_BASE_URL,
      { data: { ids } }
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get journal statistics
 */
export const getJournalStats = async (): Promise<
  ApiResponse<JournalStatsResponse>
> => {
  try {
    const response = await axios.get<JournalStatsResponse>(
      `${API_BASE_URL}/stats`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Export journals to CSV
 * Returns the download URL or triggers download
 */
export const exportJournalsToCSV = async (
  filters?: JournalFilters
): Promise<ApiResponse<Blob>> => {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await axios.get(
      `${API_BASE_URL}/export?${params.toString()}`,
      {
        responseType: 'blob'
      }
    )
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `journals-${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Search journals (convenience function)
 */
export const searchJournals = async (
  searchTerm: string,
  filters?: Omit<JournalFilters, 'search'>
): Promise<ApiResponse<JournalListResponse>> => {
  return getJournals({
    ...filters,
    search: searchTerm
  })
}

/**
 * Get public journals only
 */
export const getPublicJournals = async (
  filters?: Omit<JournalFilters, 'isPublic'>
): Promise<ApiResponse<JournalListResponse>> => {
  return getJournals({
    ...filters,
    isPublic: true
  })
}

/**
 * Get journals by teacher status
 */
export const getJournalsByTeacherStatus = async (
  teacherStatus: string,
  filters?: Omit<JournalFilters, 'teacherStatus'>
): Promise<ApiResponse<JournalListResponse>> => {
  return getJournals({
    ...filters,
    teacherStatus: teacherStatus as any
  })
}

/**
 * Get journals by scope
 */
export const getJournalsByScope = async (
  scope: string,
  filters?: Omit<JournalFilters, 'scope'>
): Promise<ApiResponse<JournalListResponse>> => {
  return getJournals({
    ...filters,
    scope: scope as any
  })
}

/**
 * Toggle journal visibility
 */
export const toggleJournalVisibility = async (
  id: string,
  isPublic: boolean
): Promise<ApiResponse<{ journal: Journal }>> => {
  return updateJournal(id, { isPublic })
}

/**
 * Update journal teacher status
 */
export const updateJournalTeacherStatus = async (
  id: string,
  teacherStatus: string
): Promise<ApiResponse<{ journal: Journal }>> => {
  return updateJournal(id, { teacherStatus: teacherStatus as any })
}
