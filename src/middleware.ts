import { NextRequest, NextResponse } from "next/server";
import { hasValidSession } from "@/lib/ownerAuth";
import { hasValidAdminSession } from "@/lib/adminAuth";

const ROOT_DOMAIN = "maw3edapp.com";

function tenantSlugFromHost(hostname: string): string | null {
  // Local dev: http://mohammads-salon.localhost:3000
  if (hostname.endsWith(".localhost") && hostname !== "localhost") {
    return hostname.slice(0, -".localhost".length);
  }
  // Production: https://mohammads-salon.maw3edapp.com
  if (hostname.endsWith(`.${ROOT_DOMAIN}`) && hostname !== `www.${ROOT_DOMAIN}`) {
    return hostname.slice(0, -(ROOT_DOMAIN.length + 1));
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") ?? "").split(":")[0];
  const slug = tenantSlugFromHost(hostname);

  // A business's own subdomain — transparently serve their booking page at "/"
  // without changing the URL the customer sees.
  if (slug && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/b/${slug}`;
    return NextResponse.rewrite(url);
  }

  const { pathname } = request.nextUrl;
  if (pathname === "/dashboard/login") {
    return NextResponse.next();
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (await hasValidSession(request)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard/login", request.url));
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (hasValidAdminSession(request)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
