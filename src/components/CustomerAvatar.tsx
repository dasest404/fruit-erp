import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Customer } from '../types';
import { findCustomerIcon } from '../config/customerIcons';

export interface CustomerAvatarProps {
  customer?: Partial<Customer> | null;
  photoUrl?: string;
  customIconUrl?: string;
  avatarIcon?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  className?: string;
  showBorder?: boolean;
  onClick?: () => void;
  title?: string;
}

const SIZE_CONFIGS = {
  xs: {
    container: 'w-6 h-6 text-[10px]',
    iconSize: 'text-xs',
    lucideSize: 'w-3 h-3',
  },
  sm: {
    container: 'w-8 h-8 text-xs',
    iconSize: 'text-sm',
    lucideSize: 'w-4 h-4',
  },
  md: {
    container: 'w-10 h-10 text-sm',
    iconSize: 'text-base',
    lucideSize: 'w-5 h-5',
  },
  lg: {
    container: 'w-14 h-14 text-base',
    iconSize: 'text-2xl',
    lucideSize: 'w-7 h-7',
  },
  xl: {
    container: 'w-20 h-20 text-lg',
    iconSize: 'text-4xl',
    lucideSize: 'w-10 h-10',
  },
  '2xl': {
    container: 'w-28 h-28 text-2xl',
    iconSize: 'text-5xl',
    lucideSize: 'w-14 h-14',
  },
};

/**
 * Reusable CustomerAvatar component implementing strict ERP Priority Logic:
 * 1. Uploaded Customer Photo (photoUrl)
 * 2. Selected Custom Icon (customIconUrl)
 * 3. Selected Default Icon (avatarIcon)
 * 4. System Default Customer Icon (User / Initials)
 *
 * Never shows broken image or empty blank area.
 */
export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  customer,
  photoUrl: propPhotoUrl,
  customIconUrl: propCustomIconUrl,
  avatarIcon: propAvatarIcon,
  name: propName,
  size = 'md',
  shape = 'circle',
  className = '',
  showBorder = true,
  onClick,
  title,
}) => {
  const [photoError, setPhotoError] = useState(false);
  const [customIconError, setCustomIconError] = useState(false);

  // Extract from customer or direct props
  const photoUrl = (propPhotoUrl !== undefined ? propPhotoUrl : customer?.photoUrl)?.trim();
  const customIconUrl = (propCustomIconUrl !== undefined ? propCustomIconUrl : customer?.customIconUrl)?.trim();
  const avatarIcon = (propAvatarIcon !== undefined ? propAvatarIcon : customer?.avatarIcon)?.trim();
  const customerName = propName || customer?.name || customer?.businessName || '';

  const sizeCfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const borderClass = showBorder ? 'border border-slate-200/80 shadow-2xs' : '';
  const cursorClass = onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : '';

  // 1. Priority 1: Uploaded Customer Photo
  if (photoUrl && !photoError) {
    return (
      <div
        onClick={onClick}
        title={title || customerName || 'Customer photo'}
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 ${sizeCfg.container} ${roundedClass} ${borderClass} ${cursorClass} ${className}`}
      >
        <img
          src={photoUrl}
          alt={customerName || 'Customer profile'}
          onError={() => setPhotoError(true)}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Priority 2: Selected Custom Icon
  if (customIconUrl && !customIconError) {
    return (
      <div
        onClick={onClick}
        title={title || customerName || 'Customer custom icon'}
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-slate-50 ${sizeCfg.container} ${roundedClass} ${borderClass} ${cursorClass} ${className}`}
      >
        <img
          src={customIconUrl}
          alt={customerName || 'Custom icon'}
          onError={() => setCustomIconError(true)}
          className="w-full h-full object-contain p-1.5"
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Priority 3: Selected Default Icon (Emoji / Predefined Icon)
  if (avatarIcon) {
    const iconMeta = findCustomerIcon(avatarIcon);
    const bgStyle = iconMeta?.colorBg || 'bg-emerald-50 text-emerald-800';

    return (
      <div
        onClick={onClick}
        title={title || iconMeta?.label || customerName || 'Customer icon'}
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${bgStyle} ${sizeCfg.container} ${roundedClass} ${borderClass} ${cursorClass} ${className}`}
      >
        <span className={`leading-none flex items-center justify-center ${sizeCfg.iconSize}`}>
          {iconMeta?.icon || avatarIcon}
        </span>
      </div>
    );
  }

  // 4. Priority 4: Default Customer Icon (Clean ERP user avatar)
  // If customerName is available, we can also extract initials
  const initials = customerName
    ? customerName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
    : '';

  return (
    <div
      onClick={onClick}
      title={title || customerName || 'Customer'}
      className={`relative inline-flex items-center justify-center shrink-0 select-none bg-slate-100 text-slate-600 font-bold font-mono ${sizeCfg.container} ${roundedClass} ${borderClass} ${cursorClass} ${className}`}
    >
      {initials && size !== 'xs' ? (
        <span className="leading-none tracking-tight">{initials}</span>
      ) : (
        <User className={`${sizeCfg.lucideSize} text-slate-500`} />
      )}
    </div>
  );
};
