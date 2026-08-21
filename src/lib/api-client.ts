import axios, { AxiosError, AxiosResponse, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API } from '../constants/api';
import { authTokens } from './auth';

let apiClient: AxiosInstance | null = null;
let refreshPromise: Promise<string | null> | null = null;

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error_code: string | null;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export type RefreshAccessToken = () => Promise<string | null>;

export function createApiClient(
  getAccessToken: () => string | null,
  onUnauthorized: () => void,
  refreshAccessToken?: RefreshAccessToken,
): AxiosInstance {
  const client = axios.create({
    baseURL: API.BASE_URL,
    timeout: API.TIMEOUT,
    withCredentials: true,
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
    async (error: AxiosError<ApiEnvelope<unknown>>) => {
      const original = error.config as RetryableConfig | undefined;
      const status = error.response?.status;
      const url = original?.url ?? '';
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/logout') ||
        url.includes('/auth/refresh');

      if (status === 401 && refreshAccessToken && original && !original._retried && !isAuthRoute) {
        original._retried = true;
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          if (original.headers) {
            original.headers.Authorization = `Bearer ${newToken}`;
          }
          return client(original);
        }
        onUnauthorized();
        return Promise.reject(error);
      }

      if (status === 401) {
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
    apiClient = createLazyClient();
  }
  return apiClient;
}

/**
 * Bootstraps a default client from the persisted token store so reads can never
 * throw before AuthProvider's effect calls createApiClient(). AuthProvider
 * replaces this with the fully-wired client once mounted.
 */
function createLazyClient(): AxiosInstance {
  return createApiClient(authTokens.getAccessToken, () => {
    // no-op on unauthorized in the lazy default client
  });
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

export function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 404
  );
}

/**
 * Run a read that legitimately returns null when the resource does not exist.
 * A 404 maps to null; every other failure (network, 5xx, auth) propagates so
 * errors surface instead of silently becoming empty data.
 */
export async function readOrNull<T>(reader: () => Promise<T>): Promise<T | null> {
  try {
    return await reader();
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}
