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
  ): Promise<T | null> {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle cases where response has no body (e.g., 204 No Content)
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
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
    delete(url: string, headers?: Record<string, string>) {
      return request<void>("DELETE", url, { headers });
    },
  };
}

export const client = { create };
