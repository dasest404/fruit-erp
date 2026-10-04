import React, { createContext, useContext, useMemo } from 'react';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE, resolveCompanyProfile } from '../config/companyProfile';
import { ERPDataStore } from '../types';

interface CompanyProfileContextType {
  profile: CompanyProfile;
}

const CompanyProfileContext = createContext<CompanyProfileContextType>({
  profile: DEFAULT_COMPANY_PROFILE,
});

export const CompanyProfileProvider: React.FC<{
  settings?: any;
  data?: ERPDataStore | null;
  children: React.ReactNode;
}> = ({ settings, data, children }) => {
  const profile = useMemo(() => {
    return resolveCompanyProfile(settings || data?.settings);
  }, [settings, data?.settings]);

  return (
    <CompanyProfileContext.Provider value={{ profile }}>
      {children}
    </CompanyProfileContext.Provider>
  );
};

export const useCompanyProfile = (): CompanyProfile => {
  const context = useContext(CompanyProfileContext);
  return context.profile || DEFAULT_COMPANY_PROFILE;
};
