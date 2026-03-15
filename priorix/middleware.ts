import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/browse",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth; 

  if (!session && !PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)", 
  ],
};
