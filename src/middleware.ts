import { NextRequest, NextResponse } from "next/server";
import { hasValidSession } from "@/lib/ownerAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/dashboard/login") {
    return NextResponse.next();
  }
  if (await hasValidSession(request)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/dashboard/login", request.url));
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
