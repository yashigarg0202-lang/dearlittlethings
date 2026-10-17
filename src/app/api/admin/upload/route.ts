import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Enforce max 10MB per file limit
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image formats
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Validate image file binary magic bytes to prevent renamed malicious payloads
 */
function validateMagicBytes(buffer: Buffer): { valid: boolean; ext?: string; mime?: string } {
  if (buffer.length < 12) {
    return { valid: false };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, ext: '.png', mime: 'image/png' };
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: '.jpg', mime: 'image/jpeg' };
  }

  // WebP: RIFF ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: '.webp', mime: 'image/webp' };
  }

  return { valid: false };
}

/**
 * Check if a configuration string is a template placeholder
 */
function isPlaceholder(value?: string | null): boolean {
  if (!value) return true;
  const clean = value.trim().toLowerCase().replace(/^["']|["']$/g, '');
  if (!clean) return true;
  return (
    clean.includes('your_supabase_url') ||
    clean.includes('your_supabase') ||
    clean.includes('your_service_role_key') ||
    clean.includes('your_') ||
    clean.includes('placeholder') ||
    clean.includes('example.com') ||
    clean.includes('<project-ref>') ||
    clean === 'null' ||
    clean === 'undefined'
  );
}

/**
 * Safely parse unverified JWT claims from the middle payload segment of a Compact JWS.
 * Does not expose or print secret key material.
 */
function parseJwtClaims(token: string): { ref?: string; role?: string; iss?: string } | null {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const jsonStr = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

interface SupabaseValidatedConfig {
  url: string;
  serviceRoleKey: string;
  projectRef: string;
}

interface ValidationResult {
  config: SupabaseValidatedConfig | null;
  error?: string;
}

/**
 * Validates that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present and correctly formatted.
 * Supports both modern Supabase secret keys (sb_secret_...) and legacy service_role JWTs (eyJ...).
 * Rejects public anon/publishable keys for administrative uploads.
 * Never prints secret values.
 */
function validateSupabaseConfig(): ValidationResult {
  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Unconfigured state (e.g. offline local development)
  if (!rawUrl && !rawKey) {
    return { config: null };
  }

  // 1. Presence checks
  if (!rawUrl || isPlaceholder(rawUrl)) {
    return {
      config: null,
      error:
        "Supabase configuration error: SUPABASE_URL is missing or set to a placeholder. Set SUPABASE_URL to your Supabase project URL (e.g., https://<project-ref>.supabase.co) in Netlify / environment variables.",
    };
  }

  if (!rawKey || isPlaceholder(rawKey)) {
    return {
      config: null,
      error:
        "Supabase configuration error: SUPABASE_SERVICE_ROLE_KEY is missing or set to a placeholder. Set SUPABASE_SERVICE_ROLE_KEY to your project's secret key (sb_secret_... or legacy service_role JWT) in Netlify / environment variables.",
    };
  }

  // 2. URL Format & Project Reference extraction
  let cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, '').trim();
  cleanUrl = cleanUrl.replace(/\/+$/, '');

  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    return {
      config: null,
      error:
        "Supabase configuration error: SUPABASE_URL is not a valid URL. Ensure it starts with https:// (e.g., https://<project-ref>.supabase.co).",
    };
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return {
      config: null,
      error:
        `Supabase configuration error: Invalid SUPABASE_URL protocol "${parsedUrl.protocol}". URL must start with https://`,
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const hostParts = hostname.split('.');
  if (hostParts.length < 2 || isPlaceholder(hostname)) {
    return {
      config: null,
      error:
        `Supabase configuration error: Invalid SUPABASE_URL hostname "${hostname}". Expected format: https://<project-ref>.supabase.co`,
    };
  }

  const urlProjectRef = hostParts[0];

  // 3. Service-Role Key Format check
  const cleanKey = rawKey.trim().replace(/^["']|["']$/g, '').trim();

  // Guard against accidental configuration of publishable key
  if (cleanKey.startsWith('sb_publishable_')) {
    return {
      config: null,
      error:
        "Supabase configuration error: SUPABASE_SERVICE_ROLE_KEY is configured with a publishable key ('sb_publishable_...'). Administrative storage uploads require the privileged secret key ('sb_secret_...' or legacy 'service_role' JWT). In Supabase Dashboard > Project Settings > API, copy the secret key.",
    };
  }

  // Case A: Modern Secret API Key (sb_secret_...)
  if (cleanKey.startsWith('sb_secret_')) {
    if (cleanKey.length < 20) {
      return {
        config: null,
        error:
          "Supabase configuration error: SUPABASE_SERVICE_ROLE_KEY is too short to be a valid modern Supabase secret key. Verify the secret key copied from Supabase Dashboard > Project Settings > API.",
      };
    }

    return {
      config: {
        url: cleanUrl,
        serviceRoleKey: cleanKey,
        projectRef: urlProjectRef,
      },
    };
  }

  // Case B: Legacy Compact JWS / JWT (eyJ...)
  const keyParts = cleanKey.split('.');
  if (keyParts.length === 3) {
    const claims = parseJwtClaims(cleanKey);
    if (!claims) {
      return {
        config: null,
        error:
          "Supabase configuration error: Could not parse claims from SUPABASE_SERVICE_ROLE_KEY. The key payload is not valid base64url-encoded JSON.",
      };
    }

    if (claims.role !== 'service_role') {
      if (claims.role === 'anon') {
        return {
          config: null,
          error:
            "Supabase configuration error: SUPABASE_SERVICE_ROLE_KEY has the 'anon' public role. Administrative storage uploads require the privileged 'service_role' secret key. In Supabase Dashboard > Project Settings > API, copy the 'service_role' key (not the 'anon' key).",
        };
      }
      return {
        config: null,
        error:
          `Supabase configuration error: SUPABASE_SERVICE_ROLE_KEY has role '${claims.role || 'unknown'}' instead of 'service_role'. Administrative storage uploads require the 'service_role' secret key.`,
      };
    }

    // Verify that key and URL belong to the exact same Supabase project
    if (claims.ref && claims.ref.toLowerCase() !== urlProjectRef) {
      return {
        config: null,
        error:
          `Supabase configuration error: Credential project mismatch. The SUPABASE_SERVICE_ROLE_KEY belongs to project '${claims.ref}', but SUPABASE_URL is configured for project '${urlProjectRef}'. Both must belong to the exact same Supabase project.`,
      };
    }

    return {
      config: {
        url: cleanUrl,
        serviceRoleKey: cleanKey,
        projectRef: urlProjectRef,
      },
    };
  }

  // Unrecognized key format
  return {
    config: null,
    error:
      "Supabase configuration error: Invalid SUPABASE_SERVICE_ROLE_KEY format. Expected either a modern secret key (starting with 'sb_secret_...') or a legacy 3-part service_role JWT (starting with 'eyJ...'). Verify the key in Supabase Dashboard > Project Settings > API.",
  };
}

// WebSocket transport fallback for server environments
const wsTransport = typeof WebSocket !== 'undefined' ? WebSocket : class {};

/**
 * Initializes an official Supabase client with the server-side service role key.
 * Session persistence and autoRefreshToken are disabled for stateless API route execution.
 */
function getSupabaseClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: wsTransport as any,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce admin authentication
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication is required to upload product images' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    // If single file uploaded under 'file'
    if (files.length === 0) {
      const singleFile = formData.get('file') as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No image files provided' }, { status: 400 });
    }

    // 2. Validate Supabase Storage configuration
    const supabaseSetup = validateSupabaseConfig();

    if (supabaseSetup.error) {
      console.error('[Upload Config Diagnostic Error]:', supabaseSetup.error);
      return NextResponse.json({ error: supabaseSetup.error }, { status: 503 });
    }

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.NETLIFY === 'true' ||
      Boolean(process.env.NETLIFY);

    // In production, serverless filesystem is read-only/ephemeral; Supabase Storage is mandatory
    if (!supabaseSetup.config && isProduction) {
      return NextResponse.json(
        {
          error:
            "Supabase Storage is required in production. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your Netlify Environment variables.",
        },
        { status: 503 }
      );
    }

    const uploadedResults: {
      url: string;
      originalName: string;
      size: number;
      mime: string;
    }[] = [];

    // Initialize Supabase client if configured
    const supabase = supabaseSetup.config
      ? getSupabaseClient(supabaseSetup.config.url, supabaseSetup.config.serviceRoleKey)
      : null;

    for (const file of files) {
      // Validate file size (10MB max)
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 10MB size limit.` },
          { status: 400 }
        );
      }

      // Validate MIME type header
      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        return NextResponse.json(
          { error: `Unsupported MIME type "${file.type}". Only PNG, JPG, and WebP images are allowed.` },
          { status: 400 }
        );
      }

      const rawExt = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(rawExt)) {
        return NextResponse.json(
          { error: `Unsupported file extension "${rawExt}". Only .png, .jpg, .jpeg, and .webp are allowed.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Verify actual magic bytes
      const magicCheck = validateMagicBytes(buffer);
      if (!magicCheck.valid) {
        return NextResponse.json(
          { error: `File "${file.name}" content does not match a valid PNG, JPG, or WebP image signature.` },
          { status: 400 }
        );
      }

      // Generate a secure, unique filename to prevent collisions & path traversal
      const safeExtension = magicCheck.ext || (rawExt === '.jpeg' ? '.jpg' : rawExt);
      const uniqueId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const timestamp = Date.now();
      const safeFilename = `product-${timestamp}-${uniqueId}${safeExtension}`;

      let publicUrl = '';

      if (supabase) {
        // Upload directly via official Supabase client to 'product-images' bucket
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(safeFilename, buffer, {
            contentType: magicCheck.mime || file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Supabase Storage upload failed:', uploadError.message);
          return NextResponse.json(
            { error: `Supabase Storage upload failed: ${uploadError.message}` },
            { status: 502 }
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(safeFilename);

        publicUrl = publicUrlData.publicUrl;
      } else {
        // Local fallback (only for offline local development without Supabase)
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        await fs.mkdir(uploadDir, { recursive: true });
        const targetPath = path.join(uploadDir, safeFilename);
        await fs.writeFile(targetPath, buffer);
        publicUrl = `/uploads/products/${safeFilename}`;
      }

      uploadedResults.push({
        url: publicUrl,
        originalName: path.basename(file.name),
        size: file.size,
        mime: magicCheck.mime || file.type,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
      // For single file convenience:
      url: uploadedResults[0]?.url,
    });
  } catch (error: unknown) {
    console.error('Error handling product image upload:', error);
    const message = error instanceof Error ? error.message : 'Server error processing image upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. Enforce admin authentication
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication is required to delete product images' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing image URL parameter' }, { status: 400 });
    }

    // Security check: Only allow deleting files strictly located inside /uploads/products/ or Supabase product-images
    const isSupabaseUrl = fileUrl.includes('/storage/v1/object/public/product-images/');
    const isLocalUpload = fileUrl.startsWith('/uploads/products/');

    if (!isSupabaseUrl && !isLocalUpload) {
      return NextResponse.json({ error: 'Cannot delete external or system assets' }, { status: 403 });
    }

    if (isSupabaseUrl) {
      const filename = fileUrl.split('/product-images/').pop()?.split('?')[0];
      const supabaseSetup = validateSupabaseConfig();
      if (supabaseSetup.error) {
        return NextResponse.json({ error: supabaseSetup.error }, { status: 503 });
      }
      if (filename && supabaseSetup.config) {
        const supabase = getSupabaseClient(supabaseSetup.config.url, supabaseSetup.config.serviceRoleKey);
        const { error: deleteError } = await supabase.storage
          .from('product-images')
          .remove([filename]);

        if (deleteError) {
          console.error('Supabase Storage delete failed:', deleteError.message);
          return NextResponse.json(
            { error: `Supabase Storage delete failed: ${deleteError.message}` },
            { status: 502 }
          );
        }
      }
      return NextResponse.json({ success: true, deleted: filename });
    } else {
      const filename = path.basename(path.normalize(fileUrl));
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
      }

      const targetPath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);

      try {
        await fs.unlink(targetPath);
      } catch (err: unknown) {
        console.warn(`File already deleted or missing at ${targetPath}:`, err);
      }

      return NextResponse.json({ success: true, deleted: filename });
    }
  } catch (error: unknown) {
    console.error('Error deleting product image:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete product image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
