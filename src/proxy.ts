import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight MVP In-Memory Rate Limiter
// Note: In a distributed edge environment, this map is isolated per instance.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute for sensitive routes

export function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;

  // Only apply rate limiting to specific sensitive POST routes
  const isRateLimitedRoute = 
    request.method === 'POST' &&
    (path === '/api/auth/register' ||
     path.startsWith('/api/auth/callback/credentials') || // Login
     path === '/api/messages/start' ||
     path.match(/^\/api\/messages\/[^\/]+$/) ||
     path.match(/^\/api\/listings\/[^\/]+\/view$/));

  if (isRateLimitedRoute) {
    const key = `${ip}-${path}`;
    const now = Date.now();
    const record = rateLimitMap.get(key) || { count: 0, lastReset: now };

    if (now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
      record.count = 1;
      record.lastReset = now;
    } else {
      record.count++;
    }

    rateLimitMap.set(key, record);

    if (record.count > MAX_REQUESTS_PER_WINDOW) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/register',
    '/api/auth/callback/credentials',
    '/api/messages/start',
    '/api/messages/:id*',
    '/api/listings/:id/view',
  ],
};
