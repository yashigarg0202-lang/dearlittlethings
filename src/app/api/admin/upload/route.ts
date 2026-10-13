import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/auth';

// Maximum allowed image size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed extensions and MIME types
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

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

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const uploadedResults: {
      url: string;
      originalName: string;
      size: number;
      mime: string;
    }[] = [];

    for (const file of files) {
      // Validate file size
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

      if (supabaseUrl && supabaseKey) {
        // Upload directly to Supabase Storage bucket 'product-images'
        const uploadEndpoint = `${supabaseUrl}/storage/v1/object/product-images/${safeFilename}`;
        const uploadRes = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': magicCheck.mime || file.type,
            'x-upsert': 'false',
          },
          body: buffer,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          console.error('Supabase Storage upload failed:', uploadRes.status, errText);
          return NextResponse.json(
            { error: `Failed to upload image to Supabase Storage: ${uploadRes.statusText}` },
            { status: 502 }
          );
        }

        publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${safeFilename}`;
      } else {
        // Local fallback (e.g. offline local development)
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

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Security check: Only allow deleting files strictly located inside /uploads/products/ or Supabase product-images
    const isSupabaseUrl = fileUrl.includes('/storage/v1/object/public/product-images/');
    const isLocalUpload = fileUrl.startsWith('/uploads/products/');

    if (!isSupabaseUrl && !isLocalUpload) {
      return NextResponse.json({ error: 'Cannot delete external or system assets' }, { status: 403 });
    }

    if (isSupabaseUrl) {
      const filename = fileUrl.split('/product-images/').pop()?.split('?')[0];
      if (filename && supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/storage/v1/object/product-images/${filename}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });
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
