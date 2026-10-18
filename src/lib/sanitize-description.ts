/**
 * Utility functions for safely extracting plain text and sanitizing HTML
 * for product descriptions across storefront cards and product detail views.
 */

/**
 * Converts a product description (which may contain HTML tags, editor metadata,
 * or ProseMirror attributes) into clean, human-readable plain text.
 * Ideal for product cards, search results, and meta descriptions.
 */
export function stripHtmlToPlainText(input?: string | null): string {
  if (!input) return '';

  let text = input;

  // 1. Strip script and style blocks entirely along with their inner content
  text = text.replace(/<\s*(?:script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|iframe|object|embed)\s*>/gi, '');

  // 2. Replace block elements and line breaks with space to prevent words from sticking together
  text = text.replace(/<\s*\/?\s*(?:p|div|h[1-6]|li|br|hr|tr|blockquote|ul|ol|table|section|article)[^>]*>/gi, ' ');

  // 3. Strip all remaining HTML tags and their attributes (including data-pm-slice, data-spread, etc.)
  text = text.replace(/<[^>]+>/g, '');

  // 4. Decode standard HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&bull;/gi, '•')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
    .replace(/&copy;/gi, '©')
    .replace(/&reg;/gi, '®')
    .replace(/&trade;/gi, '™')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return !isNaN(code) && code > 0 ? String.fromCharCode(code) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return !isNaN(code) && code > 0 ? String.fromCharCode(code) : '';
    });

  // 5. Normalize multiple spaces and tabs to a single space, trim leading/trailing whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes rich-text HTML descriptions for safe rendering in product detail views.
 * Removes all dangerous tags, event handlers, and editor metadata attributes (data-pm-slice),
 * while preserving safe formatting tags (p, strong, em, h1-h6, ul, ol, li, br, a, etc.)
 * and unicode emojis.
 */
export function sanitizeHtmlDescription(input?: string | null): string {
  if (!input) return '';

  // 1. Remove dangerous blocks entirely (<script>, <style>, <iframe>, etc.)
  let clean = input.replace(
    /<\s*(?:script|style|iframe|object|embed|svg|math|noscript|template)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|iframe|object|embed|svg|math|noscript|template)\s*>/gi,
    ''
  );

  // Remove any remaining standalone dangerous tags
  clean = clean.replace(
    /<\s*\/?\s*(?:script|style|iframe|object|embed|svg|math|noscript|template|form|input|button|select|textarea|option|meta|link|base|applet)[^>]*>/gi,
    ''
  );

  const allowedTagRegex = /^<\s*(\/?)\s*([a-z1-6]+)([^>]*)>$/i;
  const allowedTags = new Set([
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'ul',
    'ol',
    'li',
    'a',
    'blockquote',
    'span',
  ]);

  let openAnchorCount = 0;

  // 2. Parse and filter each tag
  clean = clean.replace(/<[^>]+>/g, (fullTag) => {
    const match = fullTag.match(allowedTagRegex);
    if (!match) return ''; // Strip invalid / malformed tag
    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();

    if (!allowedTags.has(tagName)) {
      return ''; // Strip non-whitelisted tag
    }

    if (isClosing) {
      if (tagName === 'a') {
        if (openAnchorCount > 0) {
          openAnchorCount--;
          return '</a>';
        }
        return '';
      }
      return `</${tagName}>`;
    }

    // Self-closing void tags
    if (tagName === 'br' || tagName === 'hr') {
      return `<${tagName} />`;
    }

    // If tag is 'a', safely extract and validate href
    if (tagName === 'a') {
      const rawAttrs = match[3];
      const hrefMatch = rawAttrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawHref = (hrefMatch ? hrefMatch[1] || hrefMatch[2] || hrefMatch[3] : '').trim();

      // Validate URL protocol (only allow safe web/mail links; block javascript:, data:, etc.)
      const isSafeProtocol =
        /^(?:https?:|\/|mailto:|tel:)/i.test(rawHref) &&
        !/^(?:javascript|data|vbscript):/i.test(rawHref);

      if (isSafeProtocol) {
        openAnchorCount++;
        const safeHref = rawHref.replace(/"/g, '&quot;');
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`;
      } else {
        return '';
      }
    }

    // For all other allowed tags (p, h1-h6, strong, em, ul, ol, li, etc.),
    // strip ALL attributes including data-pm-slice, data-spread, onclick, style, class, etc.
    return `<${tagName}>`;
  });

  return clean.trim();
}
