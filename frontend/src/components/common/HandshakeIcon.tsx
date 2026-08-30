import React from 'react';

interface HandshakeIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const HandshakeIcon: React.FC<HandshakeIconProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4.5 h-4.5',
    md: 'w-5.5 h-5.5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9'
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white border border-[#cbdaff] shadow-2xs shrink-0 p-0.5 ${sizeMap[size]} ${className}`}
      title="CareerBuddies Handshake: Partnership & Guidance"
    >
      <img
        src="/handshake-emblem.png"
        alt="CareerBuddies Handshake"
        className="w-full h-full object-contain"
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </span>
  );
};

