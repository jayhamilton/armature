import { environment } from 'src/environments/environment';

/** Thrown for a non 2xx response, carrying the status like Angular's HttpErrorResponse. */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/**
 * The React counterpart of armature-ui's TokenInterceptor (app.interceptor.ts):
 * adds the session token as `Authorization`, and `Accept: application/json`
 * only when the caller has not set `Accept` (the agent chat stream needs
 * `text/event-stream`). Resolves to the parsed JSON body, or undefined for an
 * empty body (204).
 *
 * Deliberately small and host local: the HAL client planned for
 * `@armature/core` (INC-01) replaces it, so it is not a port.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = sessionStorage.getItem(environment.sessionToken);
  if (token) {
    headers.set('Authorization', token);
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${environment.apihost}${path}`, { ...init, headers });
  if (!response.ok) {
    throw new ApiError(response.status, `${init.method ?? 'GET'} ${path} failed with ${response.status}`);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
