import React, { useState, useMemo, useRef } from 'react';
import { X, Search, Sparkles, Upload, Check, Image as ImageIcon, AlertCircle, Apple } from 'lucide-react';
import { DEFAULT_FRUIT_ICONS, FruitIconOption, SYSTEM_DEFAULT_FRUIT_ICON } from '../config/fruitIcons';
import { compressImageFile, validateImageFile } from '../utils/imageUtils';
import { FruitAvatar } from './FruitAvatar';

export interface FruitIconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon?: string;
  photoUrl?: string;
  customIconUrl?: string;
  onSelectIcon: (iconIdOrEmoji: string) => void;
  onSelectPhoto: (dataUrl: string) => void;
  onSelectCustomIcon: (dataUrl: string) => void;
  onClearVisuals?: () => void;
}

export const FruitIconPickerModal: React.FC<FruitIconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIcon = '🍎',
  photoUrl = '',
  customIconUrl = '',
  onSelectIcon,
  onSelectPhoto,
  onSelectCustomIcon,
  onClearVisuals,
}) => {
  const [activeTab, setActiveTab] = useState<'choose' | 'upload' | 'custom'>('choose');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Staged values before confirmation
  const [tempIcon, setTempIcon] = useState<string>(selectedIcon || '🍎');
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string>(photoUrl || '');
  const [tempCustomIconUrl, setTempCustomIconUrl] = useState<string>(customIconUrl || '');
  
  const [uploadError, setUploadError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const customIconFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempIcon(selectedIcon || '🍎');
      setTempPhotoUrl(photoUrl || '');
      setTempCustomIconUrl(customIconUrl || '');
      setSearchTerm('');
      setSelectedCategory('All');
      setUploadError('');
      if (photoUrl) {
        setActiveTab('upload');
      } else if (customIconUrl) {
        setActiveTab('custom');
      } else {
        setActiveTab('choose');
      }
    }
  }, [isOpen, selectedIcon, photoUrl, customIconUrl]);

  const categories = [
    'All',
    'Pome & Stone',
    'Tropical & Mango',
    'Citrus',
    'Berries & Grapes',
    'Melons',
    'Exotic & Dry Fruits',
    'Packaging',
  ];

  const filteredIcons = useMemo(() => {
    return DEFAULT_FRUIT_ICONS.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.label.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    });
  }, [selectedCategory, searchTerm]);

  if (!isOpen) return null;

  // Handle Option 1: Upload Fruit Image
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid image format. Allowed: JPG, PNG, WEBP.');
      return;
    }

    try {
      setIsProcessing(true);
      setUploadError('');
      // Optimized square fruit photo (400x400)
      const compressed = await compressImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        cropToSquare: true,
        quality: 0.88,
      });

      setTempPhotoUrl(compressed);
      setTempCustomIconUrl('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image file.');
    } finally {
      setIsProcessing(false);
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
    }
  };

  // Handle Option 3: Custom Icon Upload
  const handleCustomIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format.');
      return;
    }

    try {
      setIsProcessing(true);
      setUploadError('');
      const compressed = await compressImageFile(file, {
        maxWidth: 240,
        maxHeight: 240,
        cropToSquare: true,
        quality: 0.9,
      });

      setTempCustomIconUrl(compressed);
      setTempPhotoUrl('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process custom icon.');
    } finally {
      setIsProcessing(false);
      if (customIconFileInputRef.current) customIconFileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (tempPhotoUrl) {
      onSelectPhoto(tempPhotoUrl);
    } else if (tempCustomIconUrl) {
      onSelectCustomIcon(tempCustomIconUrl);
    } else {
      onSelectIcon(tempIcon || SYSTEM_DEFAULT_FRUIT_ICON);
    }
    onClose();
  };

  const handleClearAll = () => {
    setTempPhotoUrl('');
    setTempCustomIconUrl('');
    setTempIcon(SYSTEM_DEFAULT_FRUIT_ICON);
    if (onClearVisuals) {
      onClearVisuals();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Apple className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base font-heading">
                Choose Fruit Photo / Icon
              </h3>
              <p className="text-[11px] text-slate-400">
                1. Upload Photo • 2. Default Icon • 3. Custom Icon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Priority Preview Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">Active Preview:</span>
            <FruitAvatar
              photoUrl={tempPhotoUrl}
              customIconUrl={tempCustomIconUrl}
              avatarIcon={tempIcon}
              size="md"
              shape="square"
            />
            <div className="text-[11px]">
              <div className="font-bold text-slate-800">
                {tempPhotoUrl
                  ? 'Priority 1: Uploaded Image'
                  : tempCustomIconUrl
                  ? 'Priority 2: Custom Icon'
                  : `Priority 3: Selected Icon (${tempIcon})`}
              </div>
              <div className="text-slate-400 text-[10px]">
                {tempPhotoUrl
                  ? 'Square optimized photo'
                  : tempCustomIconUrl
                  ? 'Custom brand/supplier icon'
                  : 'Vector & catalog fruit emoji'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(tempPhotoUrl || tempCustomIconUrl || tempIcon !== SYSTEM_DEFAULT_FRUIT_ICON) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('choose')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'choose'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Choose Default Icon</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. Upload Fruit Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>3. Custom Icon</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* TAB 1: CHOOSE DEFAULT FRUIT ICON */}
          {activeTab === 'choose' && (
            <div className="space-y-4">
              {/* Search & Category Pills */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search fruit icon (e.g. Mango, Apple, Banana, Citrus)..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Fruit Icons */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {filteredIcons.map((item) => {
                  const isSelected =
                    !tempPhotoUrl &&
                    !tempCustomIconUrl &&
                    (tempIcon === item.icon || tempIcon === item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTempIcon(item.icon);
                        setTempPhotoUrl('');
                        setTempCustomIconUrl('');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                        {item.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FRUIT IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3">
                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="fruit-photo-upload"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Upload High-Resolution Fruit Image
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                    Select a square photo of your product (JPG, PNG, WEBP). Automatically compressed and optimized.
                  </p>
                </div>

                <label
                  htmlFor="fruit-photo-upload"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  {isProcessing ? 'Optimizing Image...' : 'Choose Image File'}
                </label>
              </div>

              {tempPhotoUrl && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={tempPhotoUrl}
                      alt="Uploaded fruit"
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-200 shadow-2xs"
                    />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Photo uploaded successfully</div>
                      <div className="text-[11px] text-emerald-700">Will take Priority 1 on invoices and master</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempPhotoUrl('')}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM ICON */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3">
                <input
                  ref={customIconFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleCustomIconUpload}
                  className="hidden"
                  id="fruit-custom-icon-upload"
                />

                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Upload Custom Product Logo / Icon
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                    Supplier brand mark, custom mandi label, or illustration (PNG, SVG, WEBP).
                  </p>
                </div>

                <label
                  htmlFor="fruit-custom-icon-upload"
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm shadow-amber-600/20 cursor-pointer"
                >
                  {isProcessing ? 'Optimizing Icon...' : '+ Add Custom Icon'}
                </label>
              </div>

              {tempCustomIconUrl && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={tempCustomIconUrl}
                      alt="Custom Icon"
                      className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-amber-200 shadow-2xs"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-950">Custom icon staged</div>
                      <div className="text-[11px] text-amber-800">Will take Priority 2 when photo is not present</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempCustomIconUrl('')}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Remove Custom Icon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            Apply Visual
          </button>
        </div>
      </div>
    </div>
  );
};
