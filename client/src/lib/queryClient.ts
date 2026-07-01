import { QueryClient } from "@tanstack/react-query";

/**
 * API base resolution.
 *
 * The literal `__PORT_5001__` below is a build-time proxy token: at deploy the
 * `deploy_website` step rewrites it to the proxy path (e.g. `port/5001`) so the
 * built client calls the backend. Locally it stays `__PORT_5001__`, which starts
 * with `__`, so API_BASE falls back to same-origin ("").
 *
 * DO NOT hardcode a different base or change this token — see handoff §8.
 */
const PORT_TOKEN = "__PORT_5001__";
export const API_BASE = PORT_TOKEN.startsWith("__") ? "" : `/${PORT_TOKEN}`;

export async function apiRequest<T = any>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: options?.method ?? (options?.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json" },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { _raw: text };
  }
  if (!res.ok) {
    throw new Error(json?.error || `${path} -> ${res.status}`);
  }
  return json as T;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => apiRequest(String(queryKey[0])),
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
