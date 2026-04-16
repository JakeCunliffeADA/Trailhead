import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/sign-in"];

export default auth((req: NextRequest & { auth: { user?: { id?: string } } | null }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user?.id;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith("/api/auth"),
  );

  if (!isPublic && !isLoggedIn) {
    const signInUrl = new URL("/sign-in", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static assets and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
