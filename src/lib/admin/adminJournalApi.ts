import axios, { AxiosError } from 'axios'
import {
  Journal,
  JournalListResponse,
  JournalFilters,
} from '@/types/journal'

const API_BASE_URL = '/api/admin/journals'

export interface AdminJournalStatsResponse {
  total: number
  publicCount: number
  privateCount: number
  teacherStatusCounts: Array<{ status: string; count: number }>
  journalStatusCounts: Array<{ status: string; count: number }>
  indexingCounts: Array<{ indexing: string; count: number }>
  quartileCounts: Array<{ quartile: string; count: number }>
  departmentCounts: Array<{ department: string; count: number }>
  monthlyTrend: Array<{ month: string; count: number }>
}

export interface AdminUpdateJournalInput {
  teacherStatus?: string
  journalStatus?: string
  isPublic?: boolean
  doi?: string
  publisher?: string
  impactFactor?: number | null
  quartile?: string
  indexing?: string
  publicationDate?: string | Date | null
  paperLink?: string
  title?: string
  journalName?: string
  abstract?: string | null
  serialNo?: string
  scope?: string
  reviewType?: string
  accessType?: string
  publicationMode?: string
  keywords?: string[]
  registrationFees?: number | null
  reimbursement?: number | null
  updateComment?: string | null
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
 * Get admin journal statistics
 */
export const getAdminJournalStats = async (): Promise<
  ApiResponse<AdminJournalStatsResponse>
> => {
  try {
    const response = await axios.get<AdminJournalStatsResponse>(
      `${API_BASE_URL}/stats`
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get list of journals with filters (admin view - all journals)
 */
export const getAdminJournals = async (
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
 * Get a single journal by ID (admin view)
 */
export const getAdminJournalById = async (
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
 * Update a journal (admin)
 */
export const updateAdminJournal = async (
  id: string,
  data: AdminUpdateJournalInput
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
 * Delete a single journal (admin)
 */
export const deleteAdminJournal = async (
  id: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await axios.delete<{ message: string }>(
      `/api/research/journal/${id}`
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Bulk delete journals (admin)
 */
export const bulkDeleteAdminJournals = async (
  ids: string[]
): Promise<ApiResponse<{ message: string; count: number }>> => {
  try {
    const response = await axios.delete<{ message: string; count: number }>(
      '/api/research/journal',
      { data: { ids } }
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}
