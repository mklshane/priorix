export function getUserIdFromRequest(headers: Headers): string | null {
  return headers.get("x-user-id") || null;
}
