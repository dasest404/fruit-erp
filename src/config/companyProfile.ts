/**
 * SINGLE SOURCE OF TRUTH FOR CUSTOMER BRANDING
 * Client: Hari Kripa Fruit Company (HFC)
 *
 * All areas of the ERP (Login, Header, Sidebar, Dashboard, Cash Memo,
 * Invoices, Digital Khata, Reports, PDF, Settings) read branding information
 * from this central profile to prevent hard-coding across components.
 */

export interface CompanyProfile {
  logo: string;
  emblem: string;
  name: string;
  shortName: string;
  tagline: string;
  phone1: string;
  phone2: string;
  phone2Label: string;
  phone3: string;
  phone3Label: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  gstNumber?: string;
  softwareProvider: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  logo: '/assets/hfc-logo.svg',
  emblem: '/assets/hfc-emblem.svg',
  name: 'Hari Kripa Fruit Company',
  shortName: 'HFC',
  tagline: 'FRESHNESS • QUALITY • TRUST',
  phone1: '+91 7566996333',
  phone2: '+91 9329599950',
  phone2Label: 'RJ',
  phone3: '+91 9300910015',
  phone3Label: 'DJ',
  email: 'harikripafruitco@gmail.com',
  address: 'Shop- A/6 Wholesale Fruit Market Camp-2, Power House, Bhilai (C.G.)',
  city: 'Bhilai',
  state: 'Chhattisgarh',
  pincode: '490011',
  gstNumber: '', // Not provided; do not add or invent GSTIN
  softwareProvider: 'Powered by Klyia Technology',
};

/**
 * Resolves company profile by merging backend database settings with defaults.
 * Allows the admin to modify company settings from the Settings view later
 * while maintaining the customer brand as the canonical baseline.
 */
export function resolveCompanyProfile(settings?: any): CompanyProfile {
  if (!settings) return DEFAULT_COMPANY_PROFILE;

  return {
    logo: settings.logoUrl || DEFAULT_COMPANY_PROFILE.logo,
    emblem: settings.emblemUrl || DEFAULT_COMPANY_PROFILE.emblem,
    name: settings.businessName || DEFAULT_COMPANY_PROFILE.name,
    shortName: settings.shortName || DEFAULT_COMPANY_PROFILE.shortName,
    tagline: settings.tagline || DEFAULT_COMPANY_PROFILE.tagline,
    phone1: settings.phone1 || settings.phone || DEFAULT_COMPANY_PROFILE.phone1,
    phone2: settings.phone2 || DEFAULT_COMPANY_PROFILE.phone2,
    phone2Label: settings.phone2Label || DEFAULT_COMPANY_PROFILE.phone2Label,
    phone3: settings.phone3 || DEFAULT_COMPANY_PROFILE.phone3,
    phone3Label: settings.phone3Label || DEFAULT_COMPANY_PROFILE.phone3Label,
    email: settings.email || DEFAULT_COMPANY_PROFILE.email,
    address: settings.address || DEFAULT_COMPANY_PROFILE.address,
    city: settings.city || DEFAULT_COMPANY_PROFILE.city,
    state: settings.state || DEFAULT_COMPANY_PROFILE.state,
    pincode: settings.pincode || DEFAULT_COMPANY_PROFILE.pincode,
    gstNumber: settings.gstNumber || settings.gstin || '',
    softwareProvider: DEFAULT_COMPANY_PROFILE.softwareProvider,
  };
}
