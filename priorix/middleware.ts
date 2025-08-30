// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth; // session from next-auth

  // If user is not logged in
  if (!session && !PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is logged in but tries to access a public route
  if (session && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Otherwise, continue
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)", // Protect everything except api & static
  ],
};
