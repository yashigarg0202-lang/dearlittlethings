import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

const NO_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');

  // Only protect /admin and /api/admin routes
  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionPayload = token ? await verifySessionToken(token) : null;

  // 1. Unauthenticated visitors
  if (!sessionPayload || !sessionPayload.userId) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        {
          status: 401,
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    // Redirect unauthenticated visitors to login page
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('admin', '1');
    const response = NextResponse.redirect(loginUrl);
    for (const [key, val] of Object.entries(NO_CACHE_HEADERS)) {
      response.headers.set(key, val);
    }
    return response;
  }

  // 2. Authenticated customers without ADMIN role
  if (sessionPayload.role !== 'ADMIN') {
    if (isAdminApi) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        {
          status: 403,
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    // Deny admin access to authenticated customers
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>403 Forbidden - Admin Access Denied</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #faf7f2;
      color: #3a2b24;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1.5rem;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2d7cc;
      border-radius: 8px;
      max-width: 480px;
      width: 100%;
      padding: 2.5rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(58, 43, 36, 0.05);
    }
    h1 {
      font-size: 1.75rem;
      margin: 0 0 0.5rem 0;
      color: #b33927;
    }
    p {
      color: #7c6d63;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
    }
    .btn {
      display: inline-block;
      background: #3a2b24;
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      margin: 0.25rem;
    }
    .btn-secondary {
      background: transparent;
      color: #3a2b24;
      border: 1px solid #e2d7cc;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>403 &bull; Access Denied</h1>
    <p>You are signed in, but your account does not have administrator privileges to access the studio admin portal.</p>
    <div>
      <a href="/account" class="btn">Customer Account</a>
      <a href="/" class="btn btn-secondary">Return to Shop</a>
    </div>
  </div>
</body>
</html>`,
      {
        status: 403,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...NO_CACHE_HEADERS,
        },
      }
    );
  }

  // 3. Authenticated ADMIN: proceed with strict private cache headers
  const response = NextResponse.next();
  for (const [key, val] of Object.entries(NO_CACHE_HEADERS)) {
    response.headers.set(key, val);
  }
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
