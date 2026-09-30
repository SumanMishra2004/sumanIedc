
import axios, { AxiosError } from 'axios'
import {
  FDP,
  FDPListResponse,
  FDPFilters,
  CreateFDPInput,
  UpdateFDPInput,
  FDPStatsResponse,
  ApiResponse
} from '@/types/fdp'

const API_BASE_URL = '/api/research/fdp'

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

export const getFDPs = async (
  filters?: FDPFilters
): Promise<ApiResponse<FDPListResponse>> => {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await axios.get<FDPListResponse>(
      `${API_BASE_URL}?${params.toString()}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

export const getFDPById = async (
  id: string
): Promise<ApiResponse<FDP>> => {
  try {
    const response = await axios.get<FDP>(`
      ${API_BASE_URL}/${id}`
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

export const createFDP = async (
  data: CreateFDPInput
): Promise<ApiResponse<FDP>> => {
  try {
    const response = await axios.post<FDP>(
      API_BASE_URL,
      data
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

export const updateFDP = async (
  id: string,
  data: UpdateFDPInput
): Promise<ApiResponse<FDP>> => {
  try {
    const response = await axios.patch<FDP>(
      `${API_BASE_URL}/${id}`,
      data
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

export const deleteFDP = async (
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

export const getFDPStats = async (): Promise<ApiResponse<FDPStatsResponse>> => {
    try {
        const response = await axios.get<FDPStatsResponse>(`${API_BASE_URL}/stats`);
        return { data: response.data };
    } catch (error) {
        return handleApiError(error);
    }
}

export const exportFDPsToCSV = async (filters?: FDPFilters) => {
    try {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });
        }
        
        const response = await axios.get(`${API_BASE_URL}/export`, {
            params: filters,
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `fdps-${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { success: true };
    } catch (error) {
        return handleApiError(error);
    }
}

export const bulkDeleteFDPs = async (
  ids: string[]
): Promise<ApiResponse<{ count: number }>> => {
  try {
    const response = await axios.delete<{ count: number }>(
      API_BASE_URL,
      { data: { ids } }
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}
