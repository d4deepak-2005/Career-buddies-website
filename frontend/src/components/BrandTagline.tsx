import React from 'react';

interface BrandTaglineProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'white';
  showLines?: boolean;
  className?: string;
}

// Authentic Handshake Emblem extracted directly from the official CareerBuddies Logo
export const CareerBuddiesHandshakeEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <img
    src="/handshake-emblem.png"
    alt="CareerBuddies Handshake: Partnership & Guidance"
    className={`${className} object-contain`}
    loading="eager"
    decoding="async"
    referrerPolicy="no-referrer"
  />
);

export const BrandTagline: React.FC<BrandTaglineProps> = ({
  size = 'md',
  variant = 'light',
  showLines = true,
  className = ''
}) => {
  const isDark = variant === 'dark' || variant === 'white';

  const sizeConfig = {
    xs: {
      text: 'text-[9px] sm:text-[10px]',
      badgeSize: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
      line: 'w-3 sm:w-4 h-[1.5px]',
      gap: 'gap-1 sm:gap-1.5'
    },
    sm: {
      text: 'text-[10px] sm:text-[11px] md:text-xs',
      badgeSize: 'w-4 h-4 sm:w-5 sm:h-5',
      line: 'w-4 sm:w-6 h-[1.5px]',
      gap: 'gap-1.5 sm:gap-2'
    },
    md: {
      text: 'text-[11px] sm:text-xs md:text-[13px]',
      badgeSize: 'w-5 h-5 sm:w-6 sm:h-6',
      line: 'w-5 sm:w-8 h-[2px]',
      gap: 'gap-1.5 sm:gap-2.5'
    },
    lg: {
      text: 'text-xs sm:text-sm md:text-base',
      badgeSize: 'w-6 h-6 sm:w-7 sm:h-7',
      line: 'w-8 sm:w-12 h-[2px]',
      gap: 'gap-2 sm:gap-3'
    },
    xl: {
      text: 'text-xs sm:text-sm md:text-base lg:text-lg',
      badgeSize: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8',
      line: 'w-3 sm:w-6 md:w-10 lg:w-16 h-[2px] sm:h-[2.5px]',
      gap: 'gap-1.5 sm:gap-2.5 md:gap-3 lg:gap-3.5'
    }
  }[size];

  const careerTextColor = isDark ? 'text-white' : 'text-[#002869]';
  const guidanceTextColor = isDark ? 'text-[#79fd8d]' : 'text-[#002869]';
  const separatorColor = isDark ? 'text-white/40' : 'text-[#002869]/30';
  const leftLineBg = isDark ? 'bg-white/60' : 'bg-[#002869]';
  const rightLineBg = isDark ? 'bg-[#79fd8d]' : 'bg-[#00a63f]';

  return (
    <div
      className={`inline-flex items-center justify-center ${sizeConfig.gap} whitespace-nowrap select-none font-['Plus_Jakarta_Sans',sans-serif] ${className}`}
      aria-label="Your Career | Our Guidance"
    >
      {/* Left Navy Blue Accent Line */}
      {showLines && (
        <span
          className={`rounded-full shrink-0 ${sizeConfig.line} ${leftLineBg}`}
        />
      )}

      {/* Tagline Content: Your Career | Handshake Symbol | Our Guidance */}
      <div
        className={`flex items-center gap-1 sm:gap-1.5 font-black uppercase ${sizeConfig.text} tracking-tight`}
      >
        <span className={`${careerTextColor} font-black`}>Your Career</span>

        <span className={`${separatorColor} font-semibold px-0.5`}>|</span>

        {/* Exact Handshake Image Asset from the Official CareerBuddies Logo */}
        <span
          className={`inline-flex items-center justify-center shrink-0 rounded-full bg-white shadow-2xs p-0.5 ${sizeConfig.badgeSize}`}
          title="CareerBuddies Handshake: Partnership & Guidance"
        >
          <CareerBuddiesHandshakeEmblem className="w-full h-full" />
        </span>

        <span className={`${separatorColor} font-semibold px-0.5`}>|</span>

        <span className={`${guidanceTextColor} font-black`}>Our Guidance</span>
      </div>

      {/* Right Green Accent Line */}
      {showLines && (
        <span
          className={`rounded-full shrink-0 ${sizeConfig.line} ${rightLineBg}`}
        />
      )}
    </div>
  );
};

