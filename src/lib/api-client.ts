import axios, { AxiosError, AxiosResponse, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API } from '../constants/api';

let apiClient: AxiosInstance | null = null;

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error_code: string | null;
}

export function createApiClient(
  getAccessToken: () => string | null,
  onUnauthorized: () => void,
): AxiosInstance {
  const client = axios.create({
    baseURL: API.BASE_URL,
    timeout: API.TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const body = response.data as ApiEnvelope<unknown> & { meta?: PaginationMeta };
      if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
        const meta = body.meta ?? null;
        response.data = body.data;
        if (meta !== null) {
          (response as AxiosResponse & { meta?: PaginationMeta | null }).meta = meta;
        }
      }
      return response;
    },
    (error: AxiosError<ApiEnvelope<unknown>>) => {
      if (error.response?.status === 401) {
        onUnauthorized();
      }
      const envelope = error.response?.data;
      if (envelope && envelope.message) {
        const apiError = new Error(envelope.message) as Error & { code?: string | null; status?: number };
        apiError.code = envelope.error_code ?? null;
        apiError.status = error.response?.status;
        return Promise.reject(apiError);
      }
      return Promise.reject(error);
    },
  );

  apiClient = client;
  return client;
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient() first.');
  }
  return apiClient;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export type ApiResponseWithMeta<T> = AxiosResponse<T> & { meta?: PaginationMeta | null };

export function unwrapPayload<T>(body: unknown): T {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}
