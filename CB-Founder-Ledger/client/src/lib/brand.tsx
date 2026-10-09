import { useEffect, useState } from 'react';
import { useAppConfigOptional } from './AppConfigContext';
import type { PublicBranding } from './types';

export const DEFAULT_LOGO = '/brand/careerbuddies-logo.png';
const FALLBACK: PublicBranding = { displayName: 'CareerBuddies Founder Ledger', shortName: 'CB Founder Ledger', organisationName: 'CareerBuddies', logoUrl: DEFAULT_LOGO, logoAlt: 'CareerBuddies logo', locale: 'en-IN' };

/**
 * Brand values for any screen. Signed in: from the central configuration (so a saved setting shows everywhere).
 * Signed out (login page): from the public branding endpoint. Falls back to the shipped official asset if unreachable.
 */
export function useBrand(): PublicBranding {
  const cfg = useAppConfigOptional();
  const [pub, setPub] = useState<PublicBranding>(FALLBACK);
  useEffect(() => {
    if (cfg) return;
    let cancelled = false;
    fetch('/api/branding/public').then((r) => (r.ok ? r.json() : null)).then((d: PublicBranding | null) => { if (!cancelled && d) setPub(d); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [cfg]);
  if (cfg) {
    const { business, branding } = cfg.settings;
    return { displayName: business.displayName, shortName: business.shortName, organisationName: business.organisationName, logoUrl: branding.logoUrl ?? DEFAULT_LOGO, logoAlt: branding.logoAlt, locale: cfg.settings.regional.locale };
  }
  return pub;
}
