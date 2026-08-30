import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'header' | 'footer';
  variant?: 'light' | 'dark' | 'white';
  showTagline?: boolean; // kept for interface compatibility
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'light',
  className = '',
  onClick
}) => {
  // Official Single Source of Truth Brand Asset - 100% Unchanged Original Design
  const LOGO_SRC = '/logo.png';

  // Responsive sizing presets with strictly locked aspect ratio (object-fit: contain)
  // Sized prominently so CareerBuddies name, staircase, and tagline directly below are broader and prominent
  const sizeClasses = {
    header: 'h-11 sm:h-14 md:h-18 lg:h-22 w-auto max-w-[170px] sm:max-w-[230px] md:max-w-[320px] lg:max-w-[420px]',
    footer: 'h-20 sm:h-24 md:h-28 lg:h-34 w-auto max-w-[280px] sm:max-w-[380px] md:max-w-[480px] lg:max-w-[560px]',
    sm: 'h-10 sm:h-12 md:h-14 sm:w-auto max-w-[160px] sm:max-w-[210px]',
    md: 'h-12 sm:h-15 md:h-18 w-auto max-w-[200px] sm:max-w-[280px] md:max-w-[320px]',
    lg: 'h-16 sm:h-20 md:h-24 w-auto max-w-[260px] sm:max-w-[340px] md:max-w-[400px]',
    xl: 'h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-[320px] sm:max-w-[420px] lg:max-w-[500px]',
    '2xl': 'h-24 sm:h-32 md:h-40 w-auto max-w-[380px] sm:max-w-[500px] lg:max-w-[600px]'
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
      role="banner"
      aria-label="CareerBuddies - Your Career | Our Guidance"
    >
      <img
        src={LOGO_SRC}
        alt="CareerBuddies - Your Career | Our Guidance"
        className={`${sizeClasses} object-contain object-left bg-transparent ${
          variant === 'dark'
            ? 'brightness-105'
            : 'mix-blend-multiply'
        } transition-transform duration-200`}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default BrandLogo;

