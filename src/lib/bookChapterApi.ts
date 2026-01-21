import axios, { AxiosError } from 'axios'
import {
  BookChapter,
  BookChapterListResponse,
  BookChapterFilters,
  CreateBookChapterInput,
  UpdateBookChapterInput,
  BookChapterStatsResponse,
  BulkDeleteResponse,
  ApiResponse
} from '@/types/book-chapter'

const API_BASE_URL = '/api/research/book-chapter'

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
 * Get list of book chapters with filters and pagination
 */
export const getBookChapters = async (
  filters?: BookChapterFilters
): Promise<ApiResponse<BookChapterListResponse>> => {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await axios.get<BookChapterListResponse>(
      `${API_BASE_URL}?${params.toString()}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get a single book chapter by ID
 */
export const getBookChapterById = async (
  id: string
): Promise<ApiResponse<{ bookChapter: BookChapter }>> => {
  try {
    const response = await axios.get<{ bookChapter: BookChapter }>(
      `${API_BASE_URL}/${id}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Create a new book chapter
 */
export const createBookChapter = async (
  data: CreateBookChapterInput
): Promise<ApiResponse<{ bookChapter: BookChapter }>> => {
  try {
    const response = await axios.post<{ bookChapter: BookChapter }>(
      API_BASE_URL,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Update an existing book chapter
 */
export const updateBookChapter = async (
  id: string,
  data: UpdateBookChapterInput
): Promise<ApiResponse<{ bookChapter: BookChapter }>> => {
  try {
    const response = await axios.patch<{ bookChapter: BookChapter }>(
      `${API_BASE_URL}/${id}`,
      data
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Delete a single book chapter
 */
export const deleteBookChapter = async (
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
 * Bulk delete book chapters
 */
export const bulkDeleteBookChapters = async (
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
 * Get book chapter statistics
 */
export const getBookChapterStats = async (): Promise<
  ApiResponse<BookChapterStatsResponse>
> => {
  try {
    const response = await axios.get<BookChapterStatsResponse>(
      `${API_BASE_URL}/stats`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Export book chapters to CSV
 * Returns the download URL or triggers download
 */
export const exportBookChaptersToCSV = async (
  filters?: BookChapterFilters
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
    link.setAttribute('download', `book-chapters-${new Date().toISOString()}.csv`)
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
 * Search book chapters (convenience function)
 */
export const searchBookChapters = async (
  searchTerm: string,
  filters?: Omit<BookChapterFilters, 'search'>
): Promise<ApiResponse<BookChapterListResponse>> => {
  return getBookChapters({
    ...filters,
    search: searchTerm
  })
}

/**
 * Get public book chapters only
 */
export const getPublicBookChapters = async (
  filters?: Omit<BookChapterFilters, 'isPublic'>
): Promise<ApiResponse<BookChapterListResponse>> => {
  return getBookChapters({
    ...filters,
    isPublic: true
  })
}

/**
 * Get book chapters by status
 */
export const getBookChaptersByStatus = async (
  status: string,
  filters?: Omit<BookChapterFilters, 'status'>
): Promise<ApiResponse<BookChapterListResponse>> => {
  return getBookChapters({
    ...filters,
    status: status as any
  })
}

/**
 * Toggle book chapter visibility
 */
export const toggleBookChapterVisibility = async (
  id: string,
  isPublic: boolean
): Promise<ApiResponse<{ bookChapter: BookChapter }>> => {
  return updateBookChapter(id, { isPublic })
}

/**
 * Update book chapter status
 */
export const updateBookChapterStatus = async (
  id: string,
  status: string
): Promise<ApiResponse<{ bookChapter: BookChapter }>> => {
  return updateBookChapter(id, { status: status as any })
}
