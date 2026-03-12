import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth-based route protection.
 *
 * We use the presence of the `refreshToken` httpOnly cookie as the proxy for
 * "the user has an active session".  We cannot read the accessToken (it lives
 * in React state), but the browser always sends the cookie automatically.
 *
 * Detailed token validity is confirmed server-side; the middleware only
 * decides whether a redirect is needed.
 */

const PUBLIC_PATHS = ['/login', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js internals pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has('refreshToken');
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '?'));

  // /set-password is only accessible when authenticated (first-login flow)
  const isSetPassword = pathname === '/set-password';

  // ── Unauthenticated → redirect to /login ─────────────────────────────────
  if (!hasSession && !isPublicPath && !isSetPassword) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Preserve the intended destination for post-login redirect
    if (pathname !== '/') url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // ── Already authenticated → redirect away from /login ────────────────────
  if (hasSession && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
