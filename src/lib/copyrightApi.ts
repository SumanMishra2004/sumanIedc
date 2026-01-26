import axios, { AxiosError } from 'axios'
import {
  Copyright,
  CopyrightListResponse,
  CopyrightFilters,
  CreateCopyrightInput,
  UpdateCopyrightInput,
  CopyrightStatsResponse
} from '@/types/copyright'

const API_BASE_URL = '/api/research/copyright'

// Common types
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
 * Get list of copyrights with filters and pagination
 */
export const getCopyrights = async (
  filters?: CopyrightFilters
): Promise<ApiResponse<CopyrightListResponse>> => {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await axios.get<CopyrightListResponse>(
      `${API_BASE_URL}?${params.toString()}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get a single copyright by ID
 */
export const getCopyrightById = async (
  id: string
): Promise<ApiResponse<{ copyright: Copyright }>> => {
  try {
    const response = await axios.get<{ copyright: Copyright }>(
      `${API_BASE_URL}/${id}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Create a new copyright
 */
export const createCopyright = async (
  data: CreateCopyrightInput
): Promise<ApiResponse<{ copyright: Copyright }>> => {
  try {
    const response = await axios.post<{ copyright: Copyright }>(
      API_BASE_URL,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Update an existing copyright
 */
export const updateCopyright = async (
  id: string,
  data: UpdateCopyrightInput
): Promise<ApiResponse<{ copyright: Copyright }>> => {
  try {
    const response = await axios.patch<{ copyright: Copyright }>(
      `${API_BASE_URL}/${id}`,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Delete a single copyright
 */
export const deleteCopyright = async (
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
 * Bulk delete copyrights
 */
export const bulkDeleteCopyrights = async (
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
 * Get copyright statistics
 */
export const getCopyrightStats = async (): Promise<
  ApiResponse<CopyrightStatsResponse>
> => {
  try {
    const response = await axios.get<CopyrightStatsResponse>(
      `${API_BASE_URL}/stats`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Export copyrights to CSV
 * Returns the download URL or triggers download
 */
export const exportCopyrightsToCSV = async (
  filters?: CopyrightFilters
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
    link.setAttribute('download', `copyrights-${new Date().toISOString()}.csv`)
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
 * Search copyrights (convenience function)
 */
export const searchCopyrights = async (
  searchTerm: string,
  filters?: Omit<CopyrightFilters, 'search'>
): Promise<ApiResponse<CopyrightListResponse>> => {
  return getCopyrights({
    ...filters,
    search: searchTerm
  })
}

/**
 * Get public copyrights only
 */
export const getPublicCopyrights = async (
  filters?: Omit<CopyrightFilters, 'isPublic'>
): Promise<ApiResponse<CopyrightListResponse>> => {
  return getCopyrights({
    ...filters,
    isPublic: true
  })
}

/**
 * Get copyrights by status
 */
export const getCopyrightsByStatus = async (
  status: string,
  filters?: Omit<CopyrightFilters, 'status'>
): Promise<ApiResponse<CopyrightListResponse>> => {
  return getCopyrights({
    ...filters,
    status: status as any
  })
}

/**
 * Toggle copyright visibility
 */
export const toggleCopyrightVisibility = async (
  id: string,
  isPublic: boolean
): Promise<ApiResponse<{ copyright: Copyright }>> => {
  return updateCopyright(id, { isPublic })
}

/**
 * Update copyright status
 */
export const updateCopyrightStatus = async (
  id: string,
  status: string
): Promise<ApiResponse<{ copyright: Copyright }>> => {
  return updateCopyright(id, { status: status as any })
}
