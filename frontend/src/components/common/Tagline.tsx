import React from 'react';
import { BrandTagline } from '../BrandTagline';

interface TaglineProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'white';
  showLines?: boolean;
  className?: string;
}

export const Tagline: React.FC<TaglineProps> = (props) => {
  return <BrandTagline {...props} />;
};

export default Tagline;
