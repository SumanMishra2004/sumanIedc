
import axios, { AxiosError } from 'axios'
import {
  Certificate,
  CertificateListResponse,
  CertificateFilters,
  CreateCertificateInput,
  UpdateCertificateInput,
  CertificateStatsResponse,
  ApiResponse
} from '@/types/certificate'

const API_BASE_URL = '/api/research/certificate'

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

export const getCertificates = async (
  filters?: CertificateFilters
): Promise<ApiResponse<CertificateListResponse>> => {
  try {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await axios.get<CertificateListResponse>(
      `${API_BASE_URL}?${params.toString()}`
    )
    
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

export const getCertificateById = async (
  id: string
): Promise<ApiResponse<Certificate>> => {
  try {
    const response = await axios.get<Certificate>(`
      ${API_BASE_URL}/${id}`
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

export const createCertificate = async (
  data: CreateCertificateInput
): Promise<ApiResponse<Certificate>> => {
  try {
    const response = await axios.post<Certificate>(
      API_BASE_URL,
      data
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

export const updateCertificate = async (
  id: string,
  data: UpdateCertificateInput
): Promise<ApiResponse<Certificate>> => {
  try {
    const response = await axios.patch<Certificate>(
      `${API_BASE_URL}/${id}`,
      data
    )
    return { data: response.data }
  } catch (error) {
    return handleApiError(error)
  }
}

export const deleteCertificate = async (
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

export const getCertificateStats = async (): Promise<ApiResponse<CertificateStatsResponse>> => {
    try {
        const response = await axios.get<CertificateStatsResponse>(`${API_BASE_URL}/stats`);
        return { data: response.data };
    } catch (error) {
        return handleApiError(error);
    }
}

export const exportCertificatesToCSV = async (filters?: CertificateFilters) => {
    try {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });
        }
        
        // We need to trigger a browser download, so we don't use axios directly for the file usually, 
        // or we handle the blob.
        // Let's use window.open for simplicity if possible, or axios with blob.
        // Using axios blob for better control.
        const response = await axios.get(`${API_BASE_URL}/export`, {
            params: filters,
            responseType: 'blob'
        });
        
        // Trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `certificates-${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { success: true };
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Bulk delete certificates
 */
export const bulkDeleteCertificates = async (
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

