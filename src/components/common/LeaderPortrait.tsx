import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award } from 'lucide-react';

interface LeaderPortraitProps {
  slug: string;
  name: string;
  role: string;
  title: string;
  yearsOfExperience: string;
  imageSrc: string;
  className?: string;
  aspectRatio?: string;
  showBadges?: boolean;
}

export const LeaderPortrait: React.FC<LeaderPortraitProps> = ({
  slug,
  name,
  role,
  title,
  yearsOfExperience,
  imageSrc,
  className = '',
  aspectRatio = 'aspect-[4/4.8]',
  showBadges = true
}) => {
  const getInitialSrc = () => {
    if (imageSrc) return imageSrc;
    if (slug.includes('nishant')) return '/assets/nishant.jpg';
    if (slug.includes('deepak')) return '/assets/deepak.jpg';
    if (slug.includes('divyanshu')) return '/assets/divyanshu.jpg';
    return '/assets/nishant.jpg';
  };

  const [currentSrc, setCurrentSrc] = useState<string>(getInitialSrc);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  useEffect(() => {
    setCurrentSrc(getInitialSrc());
    setAttemptCount(0);
  }, [slug, imageSrc]);

  const handleImageError = () => {
    if (attemptCount === 0) {
      setAttemptCount(1);
      if (slug.includes('nishant')) setCurrentSrc('/nishant.jpg');
      else if (slug.includes('deepak')) setCurrentSrc('/deepak.jpg');
      else if (slug.includes('divyanshu')) setCurrentSrc('/divyanshu.jpg');
    } else if (attemptCount === 1) {
      setAttemptCount(2);
      if (slug.includes('nishant')) setCurrentSrc('/assets/nishant.png');
      else if (slug.includes('deepak')) setCurrentSrc('/assets/deepak.png');
      else if (slug.includes('divyanshu')) setCurrentSrc('/assets/divyanshu.png');
    }
  };

  return (
    <div className={`relative w-full ${aspectRatio} overflow-hidden bg-[#001947] select-none ${className}`}>
      {/* Real Visible Professional Photograph */}
      <img
        src={currentSrc}
        alt={`${name} - ${title}`}
        className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          display: 'block'
        }}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />

      {/* Subtle bottom text protection gradient - specifically confined to bottom text zone */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

      {/* Top Designation Badge */}
      {showBadges && (
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="px-3.5 py-1.5 rounded-full bg-[#002869]/90 backdrop-blur-md text-white text-xs font-black border border-white/20 shadow-md flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#79fd8d]" />
            <span>{role}</span>
          </span>
        </div>
      )}

      {/* Bottom Info Overlay */}
      {showBadges && (
        <div className="absolute bottom-3.5 left-4 right-4 text-white z-10">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#79fd8d] bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md mb-1 border border-white/10">
            <Award className="w-3 h-3" />
            {yearsOfExperience}
          </span>
          <h3 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans',sans-serif] tracking-tight leading-tight drop-shadow-sm">
            {name}
          </h3>
          <p className="text-xs text-[#dae2ff] font-medium mt-0.5 drop-shadow-xs">
            {title}
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaderPortrait;
