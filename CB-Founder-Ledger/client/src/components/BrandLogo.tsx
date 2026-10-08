/** The official CareerBuddies logo, used unmodified (asset copied from the website project). */
export const LOGO_SRC = '/brand/careerbuddies-logo.png';

export function BrandLogo({ className = 'h-16' }: { className?: string }) {
  return <img src={LOGO_SRC} alt="CareerBuddies — Your Career | Our Guidance" className={`w-auto object-contain ${className}`} />;
}
