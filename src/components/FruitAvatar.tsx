import React, { useState } from 'react';
import { Apple as AppleIcon, Package } from 'lucide-react';
import { Fruit } from '../types';
import { findFruitIcon, SYSTEM_DEFAULT_FRUIT_ICON } from '../config/fruitIcons';

export interface FruitAvatarProps {
  fruit?: Partial<Fruit> | null;
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
    container: 'w-6 h-6 text-xs',
    emojiSize: 'text-xs',
    lucideSize: 'w-3 h-3',
  },
  sm: {
    container: 'w-8 h-8 text-sm',
    emojiSize: 'text-sm',
    lucideSize: 'w-4 h-4',
  },
  md: {
    container: 'w-10 h-10 text-base',
    emojiSize: 'text-lg',
    lucideSize: 'w-5 h-5',
  },
  lg: {
    container: 'w-14 h-14 text-2xl',
    emojiSize: 'text-2xl',
    lucideSize: 'w-7 h-7',
  },
  xl: {
    container: 'w-20 h-20 text-3xl',
    emojiSize: 'text-4xl',
    lucideSize: 'w-10 h-10',
  },
  '2xl': {
    container: 'w-28 h-28 text-4xl',
    emojiSize: 'text-5xl',
    lucideSize: 'w-14 h-14',
  },
};

/**
 * Reusable FruitAvatar component implementing strict ERP Priority Logic (Part 5):
 * 1. Uploaded Fruit Image (photoUrl / imageUrl / data-url / web url)
 * 2. Custom Icon (customIconUrl)
 * 3. Selected Default Fruit Icon (avatarIcon / defaultIcon / emoji)
 * 4. System Default Fruit Icon (Generic Apple / Fruit Icon)
 *
 * Never shows broken image or empty blank area.
 */
export const FruitAvatar: React.FC<FruitAvatarProps> = ({
  fruit,
  photoUrl: propPhotoUrl,
  customIconUrl: propCustomIconUrl,
  avatarIcon: propAvatarIcon,
  name: propName,
  size = 'md',
  shape = 'square',
  className = '',
  showBorder = true,
  onClick,
  title,
}) => {
  const [photoError, setPhotoError] = useState(false);
  const [customIconError, setCustomIconError] = useState(false);

  // Extract candidate values from props or fruit object
  // Some legacy fruit records store emoji or image url in fruit.image
  const candidateImage = (propPhotoUrl !== undefined ? propPhotoUrl : (fruit as any)?.photoUrl || (fruit as any)?.imageUrl || fruit?.image)?.trim();
  const isImageAUrl = candidateImage && (
    candidateImage.startsWith('data:image/') ||
    candidateImage.startsWith('http://') ||
    candidateImage.startsWith('https://') ||
    candidateImage.startsWith('/') ||
    candidateImage.endsWith('.png') ||
    candidateImage.endsWith('.jpg') ||
    candidateImage.endsWith('.jpeg') ||
    candidateImage.endsWith('.webp') ||
    candidateImage.endsWith('.svg')
  );

  const photoUrl = isImageAUrl ? candidateImage : undefined;
  const customIconUrl = (propCustomIconUrl !== undefined ? propCustomIconUrl : (fruit as any)?.customIconUrl)?.trim();
  
  // Avatar icon or emoji
  const explicitAvatarIcon = (propAvatarIcon !== undefined ? propAvatarIcon : (fruit as any)?.avatarIcon || (fruit as any)?.defaultIcon)?.trim();
  // If candidateImage was not a URL, it might be an emoji or icon id like "🍎" or "mango"
  const resolvedAvatarIcon = explicitAvatarIcon || (!isImageAUrl && candidateImage ? candidateImage : undefined);

  const fruitName = propName || fruit?.name || 'Fruit';

  const sizeCfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const borderClass = showBorder ? 'border border-slate-200/80 shadow-2xs' : '';
  const cursorClass = onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : '';

  // 1. Priority 1: Uploaded Fruit Image
  if (photoUrl && !photoError) {
    return (
      <div
        onClick={onClick}
        title={title || fruitName}
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-slate-50 ${sizeCfg.container} ${roundedClass} ${borderClass} ${cursorClass} ${className}`}
      >
        <img
          src={photoUrl}
          alt={fruitName}
          onError={() => setPhotoError(true)}
          className="w-full h-full object-cover select-none"
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Priority 2: Custom Icon / Uploaded Custom Illustration
  if (customIconUrl && !customIconError) {
    return (
      <div
        onClick={onClick}
        title={title || fruitName}
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-emerald-50/50 ${sizeCfg.container} ${roundedClass} ${borderClass} ${cursorClass} ${className}`}
      >
        <img
          src={customIconUrl}
          alt={fruitName}
          onError={() => setCustomIconError(true)}
          className="w-full h-full object-contain p-1 select-none"
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Priority 3: Selected Default Fruit Icon
  if (resolvedAvatarIcon) {
    const matched = findFruitIcon(resolvedAvatarIcon);
    const displayEmoji = matched ? matched.icon : resolvedAvatarIcon;
    const colorBg = matched?.colorBg || 'bg-emerald-50 text-emerald-800 border-emerald-100';

    return (
      <div
        onClick={onClick}
        title={title || (matched ? `${fruitName} (${matched.label})` : fruitName)}
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeCfg.container} ${roundedClass} ${borderClass} ${colorBg} ${cursorClass} ${className}`}
      >
        <span className={`${sizeCfg.emojiSize} leading-none flex items-center justify-center select-none`}>
          {displayEmoji}
        </span>
      </div>
    );
  }

  // 4. Priority 4: System Default Fruit Icon (Generic Fruit Avatar, Never broken)
  return (
    <div
      onClick={onClick}
      title={title || fruitName || 'Fruit item'}
      className={`relative inline-flex items-center justify-center shrink-0 select-none bg-emerald-50/80 text-emerald-700 border border-emerald-200/80 ${sizeCfg.container} ${roundedClass} ${borderClass} ${cursorClass} ${className}`}
    >
      <span className={`${sizeCfg.emojiSize} leading-none flex items-center justify-center select-none`}>
        {SYSTEM_DEFAULT_FRUIT_ICON}
      </span>
    </div>
  );
};
