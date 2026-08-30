import React from 'react';
import { BrandLogo } from '../BrandLogo';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'light' | 'dark' | 'white';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = (props) => {
  return <BrandLogo {...props} />;
};

export default Logo;
