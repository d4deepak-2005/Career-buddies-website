import { DEFAULT_LOGO, useBrand } from '../lib/brand';

/** The official logo (unmodified default asset) or the one an admin uploaded in Settings → Branding. One component = every location updates together. */
export function BrandLogo({ className = 'h-16' }: { className?: string }) {
  const b = useBrand();
  return <img src={b.logoUrl} alt={b.logoAlt} className={`w-auto object-contain ${className}`} onError={(e) => { if (!e.currentTarget.src.endsWith(DEFAULT_LOGO)) e.currentTarget.src = DEFAULT_LOGO; }} />;
}
