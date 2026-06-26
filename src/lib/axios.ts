import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { getAccessToken, handleUnauthorized } from "@/lib/api-token";
import type { ApiErrorShape } from "@/types";

/** Shared axios instance pointed at the JSON API (`/api/v1`). */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorShape>) => {
    if (error.response?.status === 401) {
      // Inactive/expired session — let the app sign the user out.
      handleUnauthorized();
    }
    return Promise.reject(normalizeApiError(error));
  },
);

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;
  raw: unknown;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
    raw?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.raw = raw;
  }
}

/** Turn an axios error into a predictable {message, status, fieldErrors}. */
export function normalizeApiError(error: AxiosError<ApiErrorShape>): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data;

  if (!error.response) {
    return new ApiError(
      "Network error — couldn't reach the server.",
      0,
      {},
      error,
    );
  }

  const fieldErrors: Record<string, string[]> = {};
  let message = "Something went wrong.";

  if (data && typeof data === "object") {
    if (typeof data.detail === "string") {
      message = data.detail;
    }
    for (const [key, val] of Object.entries(data)) {
      if (key === "detail") continue;
      if (Array.isArray(val)) {
        fieldErrors[key] = val.map(String);
      } else if (typeof val === "string") {
        fieldErrors[key] = [val];
      }
    }
    // Surface the first field error as the message when no `detail`.
    if (message === "Something went wrong.") {
      const first = Object.values(fieldErrors)[0]?.[0];
      if (first) message = first;
    }
  }

  if (status === 429) message = "Too many requests — please slow down.";
  if (status === 403 && message === "Something went wrong.")
    message = "You don't have permission to do that.";
  if (status === 404 && message === "Something went wrong.")
    message = "Not found.";

  return new ApiError(message, status, fieldErrors, data);
}

/** Convenience typed request helpers. */
export const http = {
  get: <T>(url: string, config?: object) =>
    api.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: object) =>
    api.post<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: object) =>
    api.patch<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: object) =>
    api.put<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: object) =>
    api.delete<T>(url, config).then((r) => r.data),
};
