import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  LogOut,
  Database,
  HardDrive,
  FolderOpen,
  RefreshCw,
  Archive,
  Laptop,
} from 'lucide-react';
import { ERPDataStore, BusinessSettings } from '../../types';
import { api } from '../../services/api';
import { DEFAULT_COMPANY_PROFILE } from '../../config/companyProfile';

interface SettingsViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
  onLogout: () => void;
  onOpenChangePassword: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onRefreshData,
  onLogout,
  onOpenChangePassword,
}) => {
  const [formData, setFormData] = useState<BusinessSettings>(() => ({
    ...data.settings,
    businessName: data.settings?.businessName || DEFAULT_COMPANY_PROFILE.name,
    shortName: data.settings?.shortName || DEFAULT_COMPANY_PROFILE.shortName,
    tagline: data.settings?.tagline || DEFAULT_COMPANY_PROFILE.tagline,
    phone1: data.settings?.phone1 || data.settings?.phone || DEFAULT_COMPANY_PROFILE.phone1,
    phone2: data.settings?.phone2 || DEFAULT_COMPANY_PROFILE.phone2,
    phone2Label: data.settings?.phone2Label || DEFAULT_COMPANY_PROFILE.phone2Label,
    phone3: data.settings?.phone3 || DEFAULT_COMPANY_PROFILE.phone3,
    phone3Label: data.settings?.phone3Label || DEFAULT_COMPANY_PROFILE.phone3Label,
    phone: data.settings?.phone || data.settings?.phone1 || DEFAULT_COMPANY_PROFILE.phone1,
    email: data.settings?.email || DEFAULT_COMPANY_PROFILE.email,
    address: data.settings?.address || DEFAULT_COMPANY_PROFILE.address,
    city: data.settings?.city || DEFAULT_COMPANY_PROFILE.city,
    state: data.settings?.state || DEFAULT_COMPANY_PROFILE.state,
    logoUrl: data.settings?.logoUrl || DEFAULT_COMPANY_PROFILE.logo,
    emblemUrl: data.settings?.emblemUrl || DEFAULT_COMPANY_PROFILE.emblem,
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Local Storage & Backup States
  const [storageInfo, setStorageInfo] = useState<{
    appDataDir: string;
    dbPath: string;
    dbExists: boolean;
    dbSizeBytes: number;
    dbSizeDisplay: string;
    engine: string;
    mode: string;
    uploadsDir: string;
    uploadsCount: number;
    backupsDir: string;
    backupsCount: number;
  } | null>(null);

  const [localBackups, setLocalBackups] = useState<
    Array<{
      filename: string;
      filepath: string;
      sizeBytes: number;
      sizeDisplay: string;
      createdAt: string;
    }>
  >([]);

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupNote, setBackupNote] = useState('');

  const loadStorageAndBackups = async () => {
    try {
      const [sInfo, bList] = await Promise.all([
        api.getStorageInfo().catch(() => null),
        api.listLocalBackups().catch(() => ({ backups: [] })),
      ]);
      if (sInfo) setStorageInfo(sInfo);
      if (bList?.backups) setLocalBackups(bList.backups);
    } catch {
      // silent fallback
    }
  };

  useEffect(() => {
    loadStorageAndBackups();
  }, []);

  const handleCreateLocalBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await api.createLocalBackup(backupNote || undefined);
      setBackupNote('');
      await loadStorageAndBackups();
      alert(`Local backup successfully created:\n${res.backup.filename}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create local backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreLocalBackup = async (filename: string) => {
    if (
      !window.confirm(
        `Are you sure you want to restore from "${filename}"?\n\nA safety backup of your current database will be saved before restoring.`
      )
    ) {
      return;
    }

    setIsRestoringBackup(true);
    try {
      await api.restoreLocalBackup(filename);
      await onRefreshData();
      await loadStorageAndBackups();
      alert('Database restored successfully from local backup!');
    } catch (err: any) {
      alert(err.message || 'Failed to restore local backup');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleOpenDataFolder = () => {
    if (window.electronAPI?.openDataFolder) {
      window.electronAPI.openDataFolder();
    } else {
      alert(`Data Directory Path:\n${storageInfo?.appDataDir || 'Default local data folder'}`);
    }
  };

  const handleInputChange = (field: keyof BusinessSettings, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setSaveMessage('');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setErrorMessage('');

    try {
      await api.updateSettings(formData);
      await onRefreshData();
      setSaveMessage('Business configuration saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const backupData = await api.exportBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `Klyia_FreshERP_Backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to export backup');
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.businessId && !parsed.settings) {
          throw new Error('Invalid backup file format');
        }
        if (
          !window.confirm(
            'Restoring backup will replace all current business records with the backup data. Continue?'
          )
        ) {
          return;
        }

        await api.importBackup(parsed);
        await onRefreshData();
        await loadStorageAndBackups();
        alert('Backup successfully restored!');
      } catch (err: any) {
        alert('Restore failed: ' + (err.message || 'Invalid JSON file'));
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reload demonstration fruits, vendors, buyers and transactions?'
      )
    ) {
      return;
    }

    try {
      await api.resetDemoData();
      await onRefreshData();
      await loadStorageAndBackups();
      alert('Demonstration sample data reloaded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo data');
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
              Business Settings &amp; Setup
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" />
              SQLite 3 Local
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Configure APMC Mandi address, GSTIN, invoice terms, SQLite local backups, and desktop storage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenChangePassword}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Local SQLite Database & Desktop Architecture Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 font-heading flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-600" />
            <span>Local Offline Application &amp; SQLite Storage Architecture</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenDataFolder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
              <span>Open Data Folder</span>
            </button>
            <button
              type="button"
              onClick={loadStorageAndBackups}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
              title="Refresh Storage Info"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Database Engine</div>
            <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQLite 3 (Relational)</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Offline Localhost Native</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Database Size</div>
            <div className="text-sm font-black text-slate-900 mt-1">
              {storageInfo?.dbSizeDisplay || 'Active'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">fresherp.db</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Local Uploads</div>
            <div className="text-sm font-black text-slate-900 mt-1">
              {storageInfo?.uploadsCount ?? 0} Files
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Stored in /uploads</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Local Backups</div>
            <div className="text-sm font-black text-slate-900 mt-1">
              {localBackups.length} Snapshots
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Timestamped .db files</div>
          </div>
        </div>

        {/* Data Directory Info */}
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs">
          <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>Persistent Windows Application Location:</span>
          </div>
          <code className="block p-2 bg-white rounded-xl border border-slate-200 text-slate-800 text-[11px] font-mono break-all select-all">
            {storageInfo?.dbPath || 'Windows AppData/KlyiaFreshERP_Data/fresherp.db'}
          </code>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Your data is stored completely separately from the application executable so software updates or reinstalls will never overwrite or erase your customer, supplier, stock, or ledger records.
          </p>
        </div>

        {/* Create Local Backup Tool */}
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-emerald-700" />
              <span>Create Timestamped SQLite Backup</span>
            </h4>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Optional backup note (e.g., before_month_end_settlement)"
              value={backupNote}
              onChange={(e) => setBackupNote(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              disabled={isCreatingBackup}
              onClick={handleCreateLocalBackup}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isCreatingBackup ? 'Backing up...' : 'Create Backup Now'}</span>
            </button>
          </div>
        </div>

        {/* Local Backups List */}
        {localBackups.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-xs text-slate-800">Saved Local Backups:</h4>
            <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-2xl overflow-hidden">
              {localBackups.map((b) => (
                <div key={b.filename} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-800">{b.filename}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(b.createdAt).toLocaleString()} &bull; {b.sizeDisplay}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isRestoringBackup}
                    onClick={() => handleRestoreLocalBackup(b.filename)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Restore This Backup
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Company Profile / Business Profile Branding Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 font-heading flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Company Profile / Business Profile</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Single Source of Truth
            </span>
          </div>

          {/* Company Logo Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            <label className="block text-xs font-bold text-slate-700 mb-2">Company Logo &amp; Official Emblem</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                <img
                  src={formData.logoUrl || DEFAULT_COMPANY_PROFILE.logo}
                  alt="Company Logo"
                  className="h-16 w-auto object-contain max-w-[200px]"
                />
              </div>
              <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                <img
                  src={formData.emblemUrl || DEFAULT_COMPANY_PROFILE.emblem}
                  alt="Company Emblem"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <div>
                  <label htmlFor="settings-logo-url" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Company Logo Asset Path / URL
                  </label>
                  <input
                    id="settings-logo-url"
                    type="text"
                    value={formData.logoUrl || ''}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="/assets/hfc-logo.svg"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('logoUrl', DEFAULT_COMPANY_PROFILE.logo);
                      handleInputChange('emblemUrl', DEFAULT_COMPANY_PROFILE.emblem);
                    }}
                    className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    Reset to Official HFC Logo
                  </button>
                  <span className="text-[11px] text-slate-400">Hari Kripa Fruit Company official badge</span>
                </div>
              </div>
            </div>
          </div>

          {/* Name & Short Name / Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="settings-business-name" className="block text-xs font-bold text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                id="settings-business-name"
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="settings-short-name" className="block text-xs font-bold text-slate-700 mb-1">
                Short Name / Brand *
              </label>
              <input
                id="settings-short-name"
                type="text"
                required
                value={formData.shortName || ''}
                onChange={(e) => handleInputChange('shortName', e.target.value)}
                placeholder="HFC"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tagline & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-tagline" className="block text-xs font-bold text-slate-700 mb-1">
                Tagline *
              </label>
              <input
                id="settings-tagline"
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="FRESHNESS • QUALITY • TRUST"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="settings-owner-name" className="block text-xs font-bold text-slate-700 mb-1">
                Owner / Proprietor *
              </label>
              <input
                id="settings-owner-name"
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Phone Numbers: Phone 1, Phone 2 (RJ), Phone 3 (DJ) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="settings-phone1" className="block text-xs font-bold text-slate-700 mb-1">
                Phone 1 (Primary) *
              </label>
              <input
                id="settings-phone1"
                type="text"
                required
                value={formData.phone1 || formData.phone || ''}
                onChange={(e) => {
                  handleInputChange('phone1', e.target.value);
                  handleInputChange('phone', e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="settings-phone2" className="block text-xs font-bold text-slate-700 mb-1">
                Phone 2 ({formData.phone2Label || 'RJ'})
              </label>
              <div className="flex gap-1.5">
                <input
                  id="settings-phone2"
                  type="text"
                  value={formData.phone2 || ''}
                  onChange={(e) => handleInputChange('phone2', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={formData.phone2Label || 'RJ'}
                  onChange={(e) => handleInputChange('phone2Label', e.target.value)}
                  title="Label"
                  className="w-14 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="settings-phone3" className="block text-xs font-bold text-slate-700 mb-1">
                Phone 3 ({formData.phone3Label || 'DJ'})
              </label>
              <div className="flex gap-1.5">
                <input
                  id="settings-phone3"
                  type="text"
                  value={formData.phone3 || ''}
                  onChange={(e) => handleInputChange('phone3', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={formData.phone3Label || 'DJ'}
                  onChange={(e) => handleInputChange('phone3Label', e.target.value)}
                  title="Label"
                  className="w-14 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Email & Business Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-email" className="block text-xs font-bold text-slate-700 mb-1">
                Email *
              </label>
              <input
                id="settings-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="settings-city" className="block text-xs font-bold text-slate-700 mb-1">
                City &amp; State
              </label>
              <input
                id="settings-city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="settings-address" className="block text-xs font-bold text-slate-700 mb-1">
              Business Address *
            </label>
            <input
              id="settings-address"
              type="text"
              required
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Billing & Tax Settings Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 font-heading border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Tax, Banking &amp; Bill Terms</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-gstin" className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
              <input
                id="settings-gstin"
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => handleInputChange('gstin', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="settings-upi-id" className="block text-xs font-bold text-slate-700 mb-1">UPI ID for Invoices</label>
              <input
                id="settings-upi-id"
                type="text"
                value={formData.upiId || ''}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="settings-bank-details" className="block text-xs font-bold text-slate-700 mb-1">
              Bank Account Details (Shown on Bill)
            </label>
            <input
              id="settings-bank-details"
              type="text"
              value={formData.bankDetails || ''}
              onChange={(e) => handleInputChange('bankDetails', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="settings-invoice-terms" className="block text-xs font-bold text-slate-700 mb-1">
              Invoice Terms &amp; Conditions (Footer)
            </label>
            <textarea
              id="settings-invoice-terms"
              rows={2}
              value={formData.invoiceTerms || ''}
              onChange={(e) => handleInputChange('invoiceTerms', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* JSON File Export / Import */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 font-heading border-b border-slate-100 pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Portable File Backup &amp; Migration</span>
        </h3>
        <p className="text-xs text-slate-500">
          In addition to automatic SQLite snapshots, you can export a portable JSON file to migrate between machines or keep offsite.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Portable Backup (.json)</span>
          </button>

          <label htmlFor="settings-restore-backup" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Portable Backup (.json)</span>
            <input
              id="settings-restore-backup"
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleResetDemoData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

