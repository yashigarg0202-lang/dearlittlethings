export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

function isPlaceholder(val?: string | null): boolean {
  if (!val) return true;
  const lower = val.toLowerCase().trim();
  return (
    lower.includes('your_') ||
    lower.includes('placeholder') ||
    lower.includes('example') ||
    lower === 'null' ||
    lower === 'undefined'
  );
}

function getSupabaseOrigin(): string | null {
  const candidates = [
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_PROJECT_URL,
  ];

  for (const c of candidates) {
    if (c && !isPlaceholder(c)) {
      return c.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    }
  }

  // Derive project reference dynamically from database connection string if set
  const dbUrls = [process.env.DATABASE_URL, process.env.DIRECT_URL];
  for (const dbUrl of dbUrls) {
    if (!dbUrl || isPlaceholder(dbUrl)) continue;
    const poolerMatch = dbUrl.match(/postgres\.([a-z0-9]+):/i);
    if (poolerMatch && poolerMatch[1] && !isPlaceholder(poolerMatch[1])) {
      return `https://${poolerMatch[1].toLowerCase()}.supabase.co`;
    }
    const hostMatch = dbUrl.match(/(?:@|\/\/)(?:db\.)?([a-z0-9]+)\.supabase\.co/i);
    if (hostMatch && hostMatch[1] && !isPlaceholder(hostMatch[1])) {
      return `https://${hostMatch[1].toLowerCase()}.supabase.co`;
    }
  }

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  const { filename } = await params;
  if (!filename || !Array.isArray(filename) || filename.length === 0) {
    return new NextResponse('File path is required', { status: 400 });
  }

  // Decode each segment first to prevent encoded traversal attacks (%2e%2e, %2f, etc.)
  const safeSegments: string[] = [];
  for (const rawSegment of filename) {
    if (!rawSegment) {
      return new NextResponse('Invalid file path segment', { status: 400 });
    }
    let decoded: string;
    try {
      decoded = decodeURIComponent(rawSegment);
    } catch {
      return new NextResponse('Invalid file path encoding', { status: 400 });
    }

    if (
      decoded === '.' ||
      decoded === '..' ||
      decoded.includes('..') ||
      decoded.includes('/') ||
      decoded.includes('\\') ||
      decoded.includes(':') ||
      decoded.includes('\0')
    ) {
      return new NextResponse('Invalid file path segment', { status: 400 });
    }

    safeSegments.push(encodeURIComponent(decoded));
  }

  const safeFilePath = safeSegments.join('/');

  const origin = getSupabaseOrigin();
  if (!origin) {
    return new NextResponse('Storage service unavailable', { status: 503 });
  }

  // Target strictly constrained to the public product-images bucket
  const targetUrl = `${origin}/storage/v1/object/public/product-images/${safeFilePath}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!upstreamRes.ok) {
      return new NextResponse('Image not found', { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/png';
    const contentLength = upstreamRes.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    };
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    // Stream response directly to avoid buffering large files in memory
    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Storage Proxy Error]:', error instanceof Error ? error.message : error);
    return new NextResponse('Failed to load image from storage', { status: 502 });
  }
}
