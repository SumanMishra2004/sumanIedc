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

export const getGrantInById = async (id: string): Promise<ApiResponse<{ grantIn: GrantIn }>> => {
  try {
    const response = await axios.get<{ grantIn: GrantIn }>(`${API_BASE_URL}/${id}`);
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
