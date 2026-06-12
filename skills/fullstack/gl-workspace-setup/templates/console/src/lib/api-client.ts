export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildRequestUrl(
  path: string,
  query?: ApiRequestOptions["query"],
) {
  const url = new URL(`${getCoreApiBaseUrl()}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function getCoreApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    throw new Error("VITE_API_URL is not configured");
  }
  return baseUrl.replace(/\/$/, "");
}

async function parseErrorMessage(response: Response) {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      const message = record.message;

      if (typeof message === "string" && message.trim()) {
        return message;
      }

      if (Array.isArray(message) && message.length > 0) {
        return message
          .map((item) => (typeof item === "string" ? item : String(item)))
          .filter(Boolean)
          .join(", ");
      }

      if (typeof record.error === "string" && record.error.trim()) {
        return record.error;
      }
    }
  } catch {
    // ignore JSON parse errors
  }
  return response.statusText || "Request failed";
}

type ApiMultipartOptions = {
  method?: string;
  formData: FormData;
  query?: ApiRequestOptions["query"];
};

export async function apiMultipartRequest<T>(
  path: string,
  { method = "POST", formData, query }: ApiMultipartOptions,
): Promise<T> {
  const response = await fetch(buildRequestUrl(path, query), {
    method,
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, query }: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(buildRequestUrl(path, query), {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
