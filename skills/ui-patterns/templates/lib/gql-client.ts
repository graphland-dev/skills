import { tokenService } from "./token-service";

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, unknown>;
  }>;
}

export type GraphQLClientConfig = {
  headers?: Record<string, string>;
};

export const gql = String.raw;

function normalizeHeaderRecord(
  headers: HeadersInit | undefined,
): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function formatGraphQLErrors(
  errors: NonNullable<GraphQLResponse<unknown>["errors"]>,
): string {
  return errors.map((e) => e.message).join(". ");
}

export class GraphQLClient {
  private endpoint: string;
  /** Headers from constructor; always merged into GraphQL requests. */
  private configHeaders: Record<string, string> = {};
  /** Mutable headers merged into every GraphQL request; cleared by `clearAllHeaders`. */
  private runtimeHeaders: Record<string, string> = {};

  constructor(endpoint: string, config?: GraphQLClientConfig) {
    this.endpoint = endpoint;
    this.configHeaders = normalizeHeaderRecord(config?.headers);
  }

  /**
   * Set a default header for subsequent `request()` calls (e.g. `x-tenant`).
   * Per-request `Authorization` still comes from `tokenService` when set.
   */
  setHeader(name: string, value: string): void {
    this.runtimeHeaders[name] = value;
  }

  /** Remove a header previously set with `setHeader`. */
  removeHeader(name: string): void {
    delete this.runtimeHeaders[name];
  }

  /**
   * Clear runtime headers set via `setHeader`.
   */
  clearAllHeaders(): void {
    this.runtimeHeaders = {};
  }

  /** Read a header from runtime (e.g. `x-tenant`) or static config. Runtime wins. */
  getHeader(name: string): string | undefined {
    return this.runtimeHeaders[name] ?? this.configHeaders[name];
  }

  async request<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T | null> {
    const headers = new Headers({
      "Content-Type": "application/json",
      ...this.configHeaders,
      ...this.runtimeHeaders,
    });

    const token = tokenService.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
      });

      let body: GraphQLResponse<T>;
      try {
        body = (await response.json()) as GraphQLResponse<T>;
      } catch {
        throw new Error(response.statusText || "Failed to parse response");
      }

      if (!response.ok) {
        const fromBody =
          body.errors && body.errors.length > 0
            ? formatGraphQLErrors(body.errors)
            : undefined;
        throw new Error(fromBody ?? `Request failed: ${response.status}`);
      }

      if (body.errors?.length) {
        throw new Error(formatGraphQLErrors(body.errors));
      }

      return body.data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw new Error("An unknown error occurred. Please try again.");
    }
  }
}

export const gqlClient = new GraphQLClient(
  `${import.meta.env.VITE_BACKEND_BASE_URL}/graphql`,
);

/**
 * Get error message from a TanStack Query mutation/query
 * Returns null if there's no error, otherwise returns the error message
 *
 * @param mutation - TanStack Query mutation/query object
 * @param fallbackMessage - Optional fallback message
 * @returns Error message string or null
 *
 * @example
 * ```ts
 * const errorMessage = getMutationErrorMessage(loginMutation, "Login failed");
 * ```
 */
export function getMutationErrorMessage<TError = unknown>(
  mutation: { isError: boolean; error: TError | null },
  fallbackMessage = "An error occurred. Please try again.",
): string | null {
  return mutation.isError
    ? getErrorMessage(mutation.error, fallbackMessage)
    : null;
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage = "An error occurred. Please try again.",
): string | null {
  if (!error) return null;

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
