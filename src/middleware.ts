import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname === "/app" ||
    pathname.startsWith("/personal") ||
    pathname.startsWith("/cliente") ||
    pathname.startsWith("/eu");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySession(token);

  if (!session && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|uploads|manifest.webmanifest|sw.js).*)",
  ],
};
