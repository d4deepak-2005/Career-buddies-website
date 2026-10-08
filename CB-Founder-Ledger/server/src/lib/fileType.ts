import type { ReceiptMime } from '../models/Receipt';

/** Detect the real type from magic bytes; never trust the client-supplied name or MIME type. */
export function detectReceiptType(buf: Buffer): { mime: ReceiptMime; ext: 'pdf' | 'jpg' | 'png' } | null {
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf' };
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  return null;
}

export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'] as const;

/** Display-only name: no path parts, no control/odd characters, bounded length. Never used for storage. */
export function sanitizeFileName(raw: string): string {
  const base = raw.replace(/\\/g, '/').split('/').pop() ?? '';
  const cleaned = base
    .normalize('NFKC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^\p{L}\p{N} ._()\-]/gu, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(-100);
  return cleaned || 'receipt';
}
