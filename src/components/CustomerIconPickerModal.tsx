import React, { useState, useMemo, useRef } from 'react';
import { X, Search, Sparkles, Upload, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { DEFAULT_CUSTOMER_ICONS, CustomerIconOption } from '../config/customerIcons';
import { compressImageFile, validateImageFile } from '../utils/imageUtils';

export interface CustomerIconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon?: string;
  customIconUrl?: string;
  onSelectIcon: (iconIdOrEmoji: string) => void;
  onSelectCustomIcon: (dataUrl: string) => void;
}

export const CustomerIconPickerModal: React.FC<CustomerIconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIcon = '👤',
  customIconUrl,
  onSelectIcon,
  onSelectCustomIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tempSelectedIcon, setTempSelectedIcon] = useState<string>(selectedIcon || '👤');
  const [tempCustomIcon, setTempCustomIcon] = useState<string>(customIconUrl || '');
  const [uploadError, setUploadError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedIcon(selectedIcon || '👤');
      setTempCustomIcon(customIconUrl || '');
      setSearchTerm('');
      setSelectedCategory('All');
      setUploadError('');
    }
  }, [isOpen, selectedIcon, customIconUrl]);

  // Categories list
  const categories = ['All', 'General', 'People', 'Business', 'Fruits'];

  // Filtered icons
  const filteredIcons = useMemo(() => {
    return DEFAULT_CUSTOMER_ICONS.filter((item) => {
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
      // Compress custom icon to 200x200 square
      const compressed = await compressImageFile(file, {
        maxWidth: 240,
        maxHeight: 240,
        cropToSquare: true,
        quality: 0.9,
      });

      setTempCustomIcon(compressed);
      setTempSelectedIcon(''); // Clear default icon selection when custom icon is uploaded
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process custom icon.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirm = () => {
    if (tempCustomIcon) {
      onSelectCustomIcon(tempCustomIcon);
    } else {
      onSelectIcon(tempSelectedIcon || '👤');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-heading">Choose Customer Icon / Avatar</h3>
              <p className="text-[11px] text-slate-400">
                Select a professional default icon or upload a custom logo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Custom Icon Quick Action Banner */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {tempCustomIcon ? (
                <div className="relative w-12 h-12 rounded-xl bg-white border border-emerald-300 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  <img src={tempCustomIcon} alt="Custom icon preview" className="w-full h-full object-contain" />
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white p-0.5 rounded-bl-md">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-dashed border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {tempCustomIcon ? 'Custom Icon Active' : '+ Add Custom Icon / Logo'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Upload brand emblem, shop logo, or custom fruit icon (PNG/JPG/WEBP)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleCustomIconUpload}
                className="hidden"
                id="custom-icon-upload-input"
              />
              <label
                htmlFor="custom-icon-upload-input"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{tempCustomIcon ? 'Replace Logo' : 'Upload Icon'}</span>
              </label>

              {tempCustomIcon && (
                <button
                  type="button"
                  onClick={() => {
                    setTempCustomIcon('');
                    setTempSelectedIcon(selectedIcon || '👤');
                  }}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {uploadError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search icons (e.g. apple, shop, company, vip)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Icons Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {filteredIcons.map((item) => {
              const isSelected = !tempCustomIcon && (tempSelectedIcon === item.icon || tempSelectedIcon === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTempCustomIcon('');
                    setTempSelectedIcon(item.icon);
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <span className="text-2xl leading-none">{item.icon}</span>
                  <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                    {item.label}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate w-full">
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No icons found matching &quot;{searchTerm}&quot;
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Selected:</span>
            {tempCustomIcon ? (
              <span className="font-bold text-emerald-700">Custom Uploaded Logo</span>
            ) : (
              <span className="text-lg leading-none">{tempSelectedIcon || '👤'}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
