/**
 * Image URL normalization utility.
 * Sanitizes Supabase Storage URLs so that server-side environment values
 * (such as SUPABASE_URL) are not serialized into static HTML or React Server
 * Component (RSC) flight payloads, preventing Netlify secret-scanning false positives.
 */
export function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If the image URL is an absolute Supabase Storage URL pointing to product-images
  if (trimmed.includes('/storage/v1/object/public/product-images/')) {
    const filename = trimmed.split('/storage/v1/object/public/product-images/').pop();
    if (filename) {
      return `/storage/v1/object/public/product-images/${filename}`;
    }
  }

  return trimmed;
}

/**
 * Sanitizes an array of product image objects in-place or returning a mapped copy.
 */
export function sanitizeProductImages<T extends { url: string }>(images: T[]): T[] {
  if (!Array.isArray(images)) return [];
  return images.map((img) => ({
    ...img,
    url: sanitizeImageUrl(img.url),
  }));
}
