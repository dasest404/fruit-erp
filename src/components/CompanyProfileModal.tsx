import React, { useState, useRef } from 'react';
import { X, Building2, Upload, AlertCircle, Check, Phone, Mail, Globe, MapPin, Landmark, FileText, UserCheck } from 'lucide-react';
import { CompanyBillProfile } from '../types';
import { api } from '../services/api';
import { compressImageFile, validateImageFile } from '../utils/imageUtils';

export interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (company: CompanyBillProfile) => void;
  initialProfile?: CompanyBillProfile | null;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialProfile,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [logo, setLogo] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [upi, setUpi] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [signature, setSignature] = useState('');
  const [authorizedPerson, setAuthorizedPerson] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialProfile) {
        setCompanyName(initialProfile.companyName || '');
        setTradeName(initialProfile.tradeName || '');
        setLogo(initialProfile.logo || '');
        setAddress(initialProfile.address || '');
        setGstin(initialProfile.gstin || '');
        setPan(initialProfile.pan || '');
        setPhone(initialProfile.phone || '');
        setEmail(initialProfile.email || '');
        setWebsite(initialProfile.website || '');
        setBankDetails(initialProfile.bankDetails || '');
        setUpi(initialProfile.upi || '');
        setTermsConditions(initialProfile.termsConditions || '');
        setSignature(initialProfile.signature || '');
        setAuthorizedPerson(initialProfile.authorizedPerson || '');
        setIsActive(initialProfile.isActive ?? true);
        setIsDefault(initialProfile.isDefault ?? false);
      } else {
        setCompanyName('');
        setTradeName('');
        setLogo('');
        setAddress('');
        setGstin('');
        setPan('');
        setPhone('');
        setEmail('');
        setWebsite('');
        setBankDetails('');
        setUpi('');
        setTermsConditions('1. Goods once sold will not be taken back.\n2. Payment terms 7 days from invoice date.\n3. Subject to local mandi jurisdiction.');
        setSignature('');
        setAuthorizedPerson('');
        setIsActive(true);
        setIsDefault(false);
      }
      setErrorMessage('');
    }
  }, [isOpen, initialProfile]);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid logo image format.');
      return;
    }

    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 320,
        maxHeight: 160,
        cropToSquare: false,
        quality: 0.9,
      });
      setLogo(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process logo.');
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid signature image format.');
      return;
    }

    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 300,
        maxHeight: 120,
        cropToSquare: false,
        quality: 0.9,
      });
      setSignature(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process signature.');
    } finally {
      if (signatureInputRef.current) signatureInputRef.current.value = '';
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

    try {
      let savedCompany: CompanyBillProfile;
      if (initialProfile?.id) {
        const res = await api.updateCompanyProfile(initialProfile.id, payload);
        savedCompany = res.companyProfile;
      } else {
        const res = await api.createCompanyProfile(payload);
        savedCompany = res.companyProfile;
      }

      onSaved(savedCompany);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save company profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base font-heading">
                {initialProfile ? 'Edit Company Bill Profile' : '+ Add New Company Bill Profile'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Seller identity for invoices, GSTIN, bank & payment details
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section: Basic Seller Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Company & Brand Identity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Fruits & Vegetables"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trade / Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC Fresh Produce"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Logo Upload & Preview */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {logo ? (
                  <img
                    src={logo}
                    alt="Company logo"
                    className="w-16 h-10 object-contain rounded-lg border border-slate-200 bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-10 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-[10px] text-slate-400">
                    No Logo
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-800">Company Invoice Logo</div>
                  <div className="text-[10px] text-slate-400">Printed on the top header of sales cash memo/bills</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="company-logo-upload"
                />
                <label
                  htmlFor="company-logo-upload"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {logo ? 'Change Logo' : 'Upload Logo'}
                </label>
                {logo && (
                  <button
                    type="button"
                    onClick={() => setLogo('')}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Logo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: Tax & Regulatory */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Tax & Legal Registrations
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Address & Contact */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Contact & Location
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Business Address *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Shop No., Market Yard, Mandi Gate, City, State, PIN"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone / Mobile *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="billing@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  placeholder="https://company.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Banking & UPI */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Banking & Payment Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Details (Printed on Invoice)
                </label>
                <textarea
                  rows={2}
                  placeholder="Bank Name, A/C Number, IFSC Code, Branch"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mobile@upi or brand@okaxis"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Used to generate dynamic UPI QR code on bill</p>
              </div>
            </div>
          </div>

          {/* Section: Terms, Signature & Authorized Person */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              5. Terms, Conditions & Authorization
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Invoice Terms & Conditions
              </label>
              <textarea
                rows={2}
                placeholder="1. Goods once sold will not be returned..."
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Person / Signatory Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma (Proprietor)"
                  value={authorizedPerson}
                  onChange={(e) => setAuthorizedPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                  id="company-signature-upload"
                />
                <div className="flex items-center gap-2">
                  {signature ? (
                    <img
                      src={signature}
                      alt="Signature"
                      className="w-20 h-10 object-contain rounded border border-slate-200 bg-white p-0.5"
                    />
                  ) : null}
                  <label
                    htmlFor="company-signature-upload"
                    className="flex-1 py-2 text-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    {signature ? 'Change Signature' : 'Upload Signature'}
                  </label>
                  {signature && (
                    <button
                      type="button"
                      onClick={() => setSignature('')}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Clear Signature"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Status & Default Toggle */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  Active (Available for billing)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-emerald-800">
                  Set as Primary Default Company
                </span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : initialProfile ? 'Update Company Profile' : 'Save Company Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
