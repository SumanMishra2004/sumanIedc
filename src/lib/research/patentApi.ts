import axios, { AxiosError } from 'axios'
import {
  Patent,
  PatentListResponse,
  PatentFilters,
  CreatePatentInput,
  UpdatePatentInput,
  PatentStatsResponse,
  BulkDeleteResponse,
  ApiResponse
} from '@/types/patent'

const API_BASE_URL = '/api/research/patent'

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
 * Get list of patents with filters and pagination
 */
export const getPatents = async (
  filters?: PatentFilters
): Promise<ApiResponse<PatentListResponse>> => {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await axios.get<PatentListResponse>(
      `${API_BASE_URL}?${params.toString()}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get a single patent by ID
 */
export const getPatentById = async (
  id: string
): Promise<ApiResponse<{ patent: Patent }>> => {
  try {
    const response = await axios.get<{ patent: Patent }>(
      `${API_BASE_URL}/${id}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Create a new patent
 */
export const createPatent = async (
  data: CreatePatentInput
): Promise<ApiResponse<{ patent: Patent }>> => {
  try {
    const response = await axios.post<{ patent: Patent }>(
      API_BASE_URL,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Update an existing patent
 */
export const updatePatent = async (
  id: string,
  data: UpdatePatentInput
): Promise<ApiResponse<{ patent: Patent }>> => {
  try {
    const response = await axios.patch<{ patent: Patent }>(
      `${API_BASE_URL}/${id}`,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Delete a patent
 */
export const deletePatent = async (
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
 * Bulk delete patents
 */
export const bulkDeletePatents = async (
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
 * Export patents to CSV
 */
export const exportPatents = async (
  filters?: PatentFilters
): Promise<Blob> => {
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
      { responseType: 'blob' }
    )
    
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get patent statistics
 */
export const getPatentStats = async (): Promise<ApiResponse<PatentStatsResponse>> => {
    try {
        const response = await axios.get<PatentStatsResponse>(
          `${API_BASE_URL}/stats`
        )
        return { data: response.data }
      } catch (error) {
        return handleApiError(error)
      }
}

