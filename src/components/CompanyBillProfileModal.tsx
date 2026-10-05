import React, { useState, useRef } from 'react';
import {
  X,
  Building,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Globe,
  CreditCard,
  QrCode,
  ShieldCheck,
  Star,
  UserCheck,
} from 'lucide-react';
import { CompanyBillProfile } from '../types';
import { api } from '../services/api';
import { compressImageFile, validateImageFile } from '../utils/imageUtils';

interface CompanyBillProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: CompanyBillProfile | null;
  onSaved: (savedProfile: CompanyBillProfile) => void;
  onRefreshData?: () => Promise<void>;
}

export const CompanyBillProfileModal: React.FC<CompanyBillProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaved,
  onRefreshData,
}) => {
  const isEditing = Boolean(profile?.id);

  const [companyName, setCompanyName] = useState(profile?.companyName || '');
  const [tradeName, setTradeName] = useState(profile?.tradeName || '');
  const [logo, setLogo] = useState(profile?.logo || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [gstin, setGstin] = useState(profile?.gstin || '');
  const [pan, setPan] = useState(profile?.pan || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [bankDetails, setBankDetails] = useState(profile?.bankDetails || '');
  const [upi, setUpi] = useState(profile?.upi || '');
  const [termsConditions, setTermsConditions] = useState(
    profile?.termsConditions ||
      '1. Immediate settlement required for mandi wholesale lots.\n2. Payment due strictly as per agreed wholesale credit cycle.\n3. Subject to local APMC Mandi jurisdiction.'
  );
  const [signature, setSignature] = useState(profile?.signature || '');
  const [authorizedPerson, setAuthorizedPerson] = useState(profile?.authorizedPerson || '');
  const [isActive, setIsActive] = useState(profile?.isActive !== false);
  const [isDefault, setIsDefault] = useState(Boolean(profile?.isDefault));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file);
    if (!val.valid) {
      setErrorMessage(val.error || 'Invalid logo image file.');
      return;
    }
    try {
      const dataUri = await compressImageFile(file, { maxWidth: 320, maxHeight: 320, cropToSquare: false });
      setLogo(dataUri);
      setErrorMessage('');
    } catch {
      setErrorMessage('Failed to process logo image.');
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file);
    if (!val.valid) {
      setErrorMessage(val.error || 'Invalid signature image file.');
      return;
    }
    try {
      const dataUri = await compressImageFile(file, { maxWidth: 400, maxHeight: 200, cropToSquare: false });
      setSignature(dataUri);
      setErrorMessage('');
    } catch {
      setErrorMessage('Failed to process signature image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMessage('Company Name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        companyName: companyName.trim(),
        tradeName: tradeName.trim() || undefined,
        logo: logo.trim() || undefined,
        address: address.trim(),
        gstin: gstin.trim().toUpperCase() || undefined,
        pan: pan.trim().toUpperCase() || undefined,
        phone: phone.trim(),
        email: email.trim().toLowerCase() || undefined,
        website: website.trim() || undefined,
        bankDetails: bankDetails.trim() || undefined,
        upi: upi.trim() || undefined,
        termsConditions: termsConditions.trim() || undefined,
        signature: signature.trim() || undefined,
        authorizedPerson: authorizedPerson.trim() || undefined,
        isActive,
        isDefault,
      };

      let saved: any;
      if (isEditing && profile?.id) {
        const res = await api.updateCompanyProfile(profile.id, payload);
        saved = res.companyProfile;
      } else {
        const res = await api.createCompanyProfile(payload);
        saved = res.companyProfile;
      }

      if (onRefreshData) {
        await onRefreshData();
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save company bill profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-heading">
                {isEditing ? `Edit Company Profile — ${profile?.companyName}` : 'Add New Company Bill Profile'}
              </h3>
              <p className="text-[11px] text-slate-300">
                The selected company will be the exclusive entity printed on bills and invoices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Basic Company Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company / Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hari Kripa Fruit Company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trade Name / Brand (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. HFC Wholesale / APMC Bhilai"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Logo & Emblem Section */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">Company Logo / Emblem</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {logo ? (
                  <img src={logo} alt="Company Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Image</span>
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or enter image URL (e.g. /assets/hfc-logo.svg)"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Address / Mandi Shop Address *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Shop- A/6 Wholesale Fruit Market Camp-2, Power House, Bhilai (C.G.) - 490001"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="+91 7566996333"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="contact@fruitco.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Website
              </label>
              <input
                type="text"
                placeholder="www.fruitco.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tax Identification (GSTIN & PAN) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN (Tax ID)
              </label>
              <input
                type="text"
                placeholder="22AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PAN
              </label>
              <input
                type="text"
                placeholder="AAAFH1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Bank Details & UPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Account Details
              </label>
              <textarea
                rows={2}
                placeholder="Bank: SBI | A/C: 38920192831 | IFSC: SBIN0004321 | Branch: Power House"
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UPI ID (for QR Code & Bill Payment)
              </label>
              <input
                type="text"
                placeholder="harikripa@upi"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Printed on bill for direct digital customer payment</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invoice Terms &amp; Conditions (Printed on Bill Footer)
            </label>
            <textarea
              rows={2}
              placeholder="Terms printed at bottom of every bill..."
              value={termsConditions}
              onChange={(e) => setTermsConditions(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Signature & Authorized Person */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Signatory / Person Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Patel (Proprietor)"
                  value={authorizedPerson}
                  onChange={(e) => setAuthorizedPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Digital Signature Image
                </label>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-24 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {signature ? (
                      <img src={signature} alt="Sign" className="h-full w-full object-contain p-0.5" />
                    ) : (
                      <span className="text-[10px] text-slate-400">No Sign</span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={signatureInputRef}
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Upload Sign
                  </button>
                  {signature && (
                    <button
                      type="button"
                      onClick={() => setSignature('')}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Default Settings */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-800">
                Set as Default Company Profile for new bills
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-700">Active Profile</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Profile...' : isEditing ? 'Update Profile' : 'Save Company Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
