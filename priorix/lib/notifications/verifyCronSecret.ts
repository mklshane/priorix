import { NextRequest } from "next/server";

/**
 * Validates the cron invocation secret.
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when invoking cron routes.
 * In development, passing `?force=1` bypasses the check for easy local testing.
 */
export function verifyCronSecret(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") {
    if (req.nextUrl.searchParams.get("force") === "1") return true;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
