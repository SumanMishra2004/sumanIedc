import axios, { AxiosError } from 'axios'
import {
  Conference,
  ConferenceListResponse,
  ConferenceFilters,
  CreateConferenceInput,
  UpdateConferenceInput,
  ConferenceStatsResponse,
  ApiResponse
} from '@/types/conference'
import { ConferenceStatus } from '@prisma/client'

const API_BASE_URL = '/api/research/conference'

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
 * Get list of conferences with filters and pagination
 */
export const getConferences = async (
  filters?: ConferenceFilters
): Promise<ApiResponse<ConferenceListResponse>> => {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
             value.forEach(v => params.append(key, String(v)))
          } else {
             params.append(key, String(value))
          }
        }
      })
    }

    const response = await axios.get<ConferenceListResponse>(
      `${API_BASE_URL}?${params.toString()}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get a single conference by ID
 */
export const getConferenceById = async (
  id: string
): Promise<ApiResponse<{ conference: Conference }>> => {
  try {
    const response = await axios.get<{ conference: Conference }>(
      `${API_BASE_URL}/${id}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Create a new conference
 */
export const createConference = async (
  data: CreateConferenceInput
): Promise<ApiResponse<{ conference: Conference }>> => {
  try {
    const response = await axios.post<{ conference: Conference }>(
      API_BASE_URL,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Update an existing conference
 */
export const updateConference = async (
  id: string,
  data: UpdateConferenceInput
): Promise<ApiResponse<{ conference: Conference }>> => {
  try {
    const response = await axios.patch<{ conference: Conference }>(
      `${API_BASE_URL}/${id}`,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Delete a conference
 */
export const deleteConference = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.delete<{ success: boolean }>(
      `${API_BASE_URL}/${id}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get conference statistics
 */
export const getConferenceStats = async (): Promise<ApiResponse<ConferenceStatsResponse>> => {
  try {
    const response = await axios.get<ConferenceStatsResponse>(
      `${API_BASE_URL}/stats`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}


/**
 * Export conferences
 */
export const exportConferences = async (
  filters?: ConferenceFilters
): Promise<ApiResponse<any>> => {
    try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
           if (Array.isArray(value)) {
             value.forEach(v => params.append(key, String(v)))
          } else {
             params.append(key, String(value))
          }
        }
      })
    }

    const response = await axios.get(
      `${API_BASE_URL}/export?${params.toString()}`,
      { responseType: 'blob' }
    )
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `conferences-${new Date().toISOString()}.csv`)
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
 * Toggle conference visibility
 */
export const toggleConferenceVisibility = async (
  id: string,
  isPublic: boolean
): Promise<ApiResponse<{ conference: Conference }>> => {
  return updateConference(id, { isPublic })
}

/**
 * Update conference status
 */
export const updateConferenceStatus = async (
  id: string,
  status: ConferenceStatus
): Promise<ApiResponse<{ conference: Conference }>> => {
  return updateConference(id, { conferenceStatus: status })
}
