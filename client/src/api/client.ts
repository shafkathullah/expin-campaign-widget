// All requests go through Vite's `/api` proxy → mock-server on port 4000.
// Keeping the base path centralised so a future switch to a real host is one edit.

export const API_BASE = '/api';
export const STREAM_BASE = '/api';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  // 409 is returned by the boost endpoint when the creator is already boosted.
  // We let callers branch on `ApiError.status` rather than read the body.
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}
