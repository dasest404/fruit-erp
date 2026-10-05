import React, { createContext, useContext, useMemo } from 'react';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE, resolveCompanyProfile } from '../config/companyProfile';
import { ERPDataStore, CompanyBillProfile } from '../types';

interface CompanyProfileContextType {
  profile: CompanyProfile;
  companyProfiles: CompanyBillProfile[];
  defaultCompanyProfile?: CompanyBillProfile;
}

const CompanyProfileContext = createContext<CompanyProfileContextType>({
  profile: DEFAULT_COMPANY_PROFILE,
  companyProfiles: [],
});

export const CompanyProfileProvider: React.FC<{
  settings?: any;
  data?: ERPDataStore | null;
  children: React.ReactNode;
}> = ({ settings, data, children }) => {
  const profile = useMemo(() => {
    return resolveCompanyProfile(settings || data?.settings);
  }, [settings, data?.settings]);

  const companyProfiles = useMemo(() => {
    return data?.companyProfiles || [];
  }, [data?.companyProfiles]);

  const defaultCompanyProfile = useMemo(() => {
    return companyProfiles.find((c) => c.isDefault && c.isActive) || companyProfiles.find((c) => c.isActive) || companyProfiles[0];
  }, [companyProfiles]);

  return (
    <CompanyProfileContext.Provider value={{ profile, companyProfiles, defaultCompanyProfile }}>
      {children}
    </CompanyProfileContext.Provider>
  );
};

export const useCompanyProfile = (): CompanyProfile => {
  const context = useContext(CompanyProfileContext);
  return context.profile || DEFAULT_COMPANY_PROFILE;
};

export const useCompanyProfiles = () => {
  const context = useContext(CompanyProfileContext);
  return {
    companyProfiles: context.companyProfiles,
    defaultCompanyProfile: context.defaultCompanyProfile,
  };
};
