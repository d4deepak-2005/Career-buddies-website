import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  badgeIcon?: LucideIcon;
  badgeColor?: 'blue' | 'green' | 'dark';
  dark?: boolean;
  className?: string;
  size?: 'md' | 'lg' | 'xl';
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  badgeIcon: BadgeIcon,
  badgeColor = 'blue',
  dark = false,
  className = '',
  size = 'lg'
}) => {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto'
  }[align];

  // Strong, prominent typography hierarchy: Desktop 48-64px, Tablet 36-44px, Mobile 24-32px
  const titleSizes = {
    md: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold',
    lg: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight',
    xl: 'text-2xl sm:text-3.5xl md:text-5xl lg:text-6xl font-black tracking-tight'
  }[size];

  const badgeThemeClasses = {
    blue: dark 
      ? 'bg-white/10 text-white border-white/20' 
      : 'bg-[#dae2ff] text-[#001947] border-[#cbdaff]',
    green: dark 
      ? 'bg-[#79fd8d]/20 text-[#79fd8d] border-[#79fd8d]/30' 
      : 'bg-[#79fd8d]/25 text-[#00531d] border-[#006e29]/20',
    dark: 'bg-[#002869] text-white border-[#002869]'
  }[badgeColor];

  const textColor = dark ? 'text-white' : 'text-[#061b3b]';
  const descColor = dark ? 'text-[#dae2ff]' : 'text-[#434652]';

  return (
    <div className={`flex flex-col gap-3.5 max-w-3xl ${alignmentClasses} ${className}`}>
      {eyebrow && (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${badgeThemeClasses} w-fit shadow-2xs`}>
          {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5 shrink-0" />}
          <span>{eyebrow}</span>
        </div>
      )}

      <h2 className={`${titleSizes} ${textColor} leading-[1.12] font-['Plus_Jakarta_Sans',sans-serif]`}>
        {title}
      </h2>

      {description && (
        <p className={`text-base sm:text-lg ${descColor} leading-relaxed max-w-2xl font-medium`}>
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
