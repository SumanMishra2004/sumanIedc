import axios, { AxiosError } from "axios";
import {
  GrantIn,
  GrantInPOSTRequestBodyData,
  ApiResponse,
  GrantInListResponse,
  GrantInFilters,
  GrantStatsResponse,
} from "@/types/grant-in";

const API_BASE_URL = "/api/research/grant-in";

const handleApiError = (error: unknown): { error: string } => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    return {
      error:
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "An unexpected error occurred",
    };
  }
  return { error: "An unexpected error occurred" };
};

export const createGrantIn = async (
  data: GrantInPOSTRequestBodyData
): Promise<ApiResponse<{ grantIn: GrantIn }>> => {
  try {
    const response = await axios.post<{ grantIn: GrantIn }>(API_BASE_URL, data);
    return { data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchGrantIns = async (
  filters?: GrantInFilters
): Promise<ApiResponse<GrantInListResponse>> => {
  try {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const response = await axios.get<GrantInListResponse>(`${API_BASE_URL}?${params.toString()}`);
    return { data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getGrantStats = async (): Promise<ApiResponse<GrantStatsResponse>> => {
  try {
    const response = await axios.get<{ data: GrantStatsResponse }>(`${API_BASE_URL}/stats`);
    // The API structure for stats is { data: { ... } } so response.data.data is correct based on my implementation
    // But wait, my stats route returns NextResponse.json({ data: { ... } }) ?
    // Let me check my stats route code again.
    // Yes: return NextResponse.json({ data: { ... } })
    return { data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getGrantInById = async (id: string): Promise<ApiResponse<{ grant: GrantIn }>> => {
  try {
    const response = await axios.get<{ grant: GrantIn }>(`${API_BASE_URL}/${id}`);
    return { data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteGrantIn = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`);
    return {};
  } catch (error) {
     return handleApiError(error);
  }
};

// ─── Bills ────────────────────────────────────────────────────────────────────

export const uploadBill = async (
  grantId: string,
  formData: FormData
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/${grantId}/bills/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return { data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateBillStatus = async (
  grantId: string,
  billId: string,
  action: "ACCEPT" | "REJECT"
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/${grantId}/bills/${billId}`,
      { action }
    );
    return { data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteBill = async (
  grantId: string,
  billId: string
): Promise<ApiResponse<void>> => {
  try {
    await axios.delete(`${API_BASE_URL}/${grantId}/bills/${billId}`);
    return {};
  } catch (error) {
    return handleApiError(error);
  }
};

// ─── Publication Outputs ──────────────────────────────────────────────────────

export const addGrantOutput = async (
  grantId: string,
  payload: {
    publicationType: string;
    patentId?: string;
    journalId?: string;
    conferenceId?: string;
    bookChapterId?: string;
    copyrightId?: string;
  }
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${grantId}/output`, payload);
    return { data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const removeGrantOutput = async (
  grantId: string,
  mappingId: string
): Promise<ApiResponse<void>> => {
  try {
    await axios.delete(`${API_BASE_URL}/${grantId}/output`, {
      data: { mappingId },
    });
    return {};
  } catch (error) {
    return handleApiError(error);
  }
};

export const bulkDeleteGrantIns = async (
  ids: string[]
): Promise<ApiResponse<{ count: number }>> => {
  try {
    const response = await axios.delete<{ message: string; count?: number }>(
      `${API_BASE_URL}?grantIds=${ids.join(",")}`
    );
    return { data: { count: ids.length } };
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchBills = async (
  status?: string
): Promise<ApiResponse<{ bills: any[] }>> => {
  try {
    const url = status ? `${API_BASE_URL}/bills?status=${status}` : `${API_BASE_URL}/bills`;
    const response = await axios.get<{ bills: any[] }>(url);
    return { data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};
