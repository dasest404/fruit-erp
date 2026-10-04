import React from 'react';
import { DEFAULT_COMPANY_PROFILE } from '../../config/companyProfile';

export interface HFCLogoProps {
  variant?: 'full' | 'emblem' | 'horizontal' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
  alt?: string;
  onClick?: () => void;
}

export const HFCLogo: React.FC<HFCLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showTagline = true,
  alt = 'Hari Kripa Fruit Company (HFC)',
  onClick,
}) => {
  // Dimension presets to ensure crisp, distortion-free rendering
  const sizeMap = {
    xs: { emblem: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]', full: 'max-w-[140px]' },
    sm: { emblem: 'w-9 h-9', text: 'text-sm', sub: 'text-[10px]', full: 'max-w-[200px]' },
    md: { emblem: 'w-11 h-11', text: 'text-base', sub: 'text-xs', full: 'max-w-[260px]' },
    lg: { emblem: 'w-16 h-16', text: 'text-lg', sub: 'text-xs', full: 'max-w-[340px]' },
    xl: { emblem: 'w-24 h-24 sm:w-28 sm:h-28', text: 'text-2xl', sub: 'text-sm', full: 'max-w-[420px]' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === 'full') {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center justify-center text-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <img
          src={DEFAULT_COMPANY_PROFILE.logo}
          alt={alt}
          className={`w-full ${currentSize.full} h-auto object-contain transition-transform duration-200 drop-shadow-sm`}
          loading="eager"
        />
      </div>
    );
  }

  if (variant === 'emblem') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 select-none ${currentSize.emblem} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <img
          src={DEFAULT_COMPANY_PROFILE.emblem}
          alt={alt}
          className="w-full h-full object-contain rounded-full drop-shadow-xs"
          loading="eager"
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 select-none min-w-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <img
          src={DEFAULT_COMPANY_PROFILE.emblem}
          alt={alt}
          className={`${currentSize.emblem} object-contain rounded-full drop-shadow-xs shrink-0`}
          loading="eager"
        />
        <div className="min-w-0 leading-tight">
          <span className={`font-black tracking-tight text-slate-900 font-heading block truncate ${currentSize.text}`}>
            {DEFAULT_COMPANY_PROFILE.shortName}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold block truncate">
            {DEFAULT_COMPANY_PROFILE.name}
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal Brand Lockup (Emblem + Name + Tagline)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none min-w-0 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      title={`${DEFAULT_COMPANY_PROFILE.name} • ${DEFAULT_COMPANY_PROFILE.tagline}`}
    >
      <div className={`${currentSize.emblem} shrink-0 transition-transform group-hover:scale-105 duration-150`}>
        <img
          src={DEFAULT_COMPANY_PROFILE.emblem}
          alt={alt}
          className="w-full h-full object-contain rounded-full drop-shadow-xs"
          loading="eager"
        />
      </div>

      <div className="min-w-0 text-left">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-black tracking-tight text-slate-900 font-heading truncate ${currentSize.text}`}>
            {DEFAULT_COMPANY_PROFILE.name}
          </span>
        </div>
        {showTagline && (
          <p className={`font-semibold text-emerald-800 tracking-wide truncate ${currentSize.sub}`}>
            {DEFAULT_COMPANY_PROFILE.tagline}
          </p>
        )}
      </div>
    </div>
  );
};
