import type { ApiResponse } from "@/types/api";

/**
 * Custom error class for API errors
 * Includes the HTTP status code and error message from the server
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ClientConfig = {
  baseURL: string;
};

type RequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
};

function create(config: ClientConfig) {
  const { baseURL } = config;

  async function request<T>(
    method: string,
    url: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const fullUrl = `${baseURL}${url}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(fullUrl, fetchOptions);

    // Parse the response body
    const text = await response.text();
    const data: ApiResponse<T> = text
      ? JSON.parse(text)
      : { success: false, data: null, error: "Empty response" };

    // Check if the API call was successful
    if (!data.success || !response.ok) {
      const errorMessage =
        data.error || `HTTP error! status: ${response.status}`;
      throw new ApiError(errorMessage, response.status);
    }

    return data.data;
  }

  return {
    get<T>(url: string, headers?: Record<string, string>) {
      return request<T>("GET", url, { headers });
    },
    post<T>(url: string, body?: unknown, headers?: Record<string, string>) {
      return request<T>("POST", url, { body, headers });
    },
    patch<T>(url: string, body?: unknown, headers?: Record<string, string>) {
      return request<T>("PATCH", url, { body, headers });
    },
    delete<T = void>(url: string, headers?: Record<string, string>) {
      return request<T>("DELETE", url, { headers });
    },
  };
}

export const client = { create };
