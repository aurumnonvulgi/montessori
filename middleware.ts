import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthenticatedCookie } from "./app/lib/appAuth";

const PUBLIC_LANDING_PREVIEW_PATHS = new Set([
  "/lessons/language-arts/phonics/reading-book",
  "/lessons/language-arts/consonant-blends/double-alphabet/cr",
  "/lessons/language-arts/lilac-word-lists/1-30",
  "/lessons/language-arts/concept-development/opposites",
  "/lessons/language-arts/phonic-three-part-cards-labels/i",
  "/lessons/numerals-and-counters/stage-1",
  "/lessons/history-time/hour-clock/three-part-cards-pictures-labels",
]);

const isProtectedPath = (pathname: string) => {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/lessons" ||
    pathname.startsWith("/lessons/")
  );
};

const isPublicLandingPreviewRequest = (request: NextRequest) => {
  const { pathname, searchParams } = request.nextUrl;
  return (
    searchParams.get("landingPreview") === "1" &&
    PUBLIC_LANDING_PREVIEW_PATHS.has(pathname)
  );
};

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthed = isAuthenticatedCookie(authCookie);

  if (pathname === "/login" && isAuthed) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  if (isProtectedPath(pathname) && !isAuthed) {
    if (isPublicLandingPreviewRequest(request)) {
      return NextResponse.next();
    }
    const destination = request.nextUrl.clone();
    destination.pathname = "/login";
    destination.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/lessons/:path*"],
};
