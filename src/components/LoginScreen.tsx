import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, MapPin, Phone, Mail } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { HFCLogo } from './common/HFCLogo';
import { DEFAULT_COMPANY_PROFILE } from '../config/companyProfile';

interface LoginScreenProps {
  onLoginSuccess: (user: { username: string; role: string; mustChangePassword: boolean; businessName: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('klyiatech');
  const [password, setPassword] = useState('klyia123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login({
        username: username.trim(),
        password,
      });
      setAuthToken(res.token);
      onLoginSuccess(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid login credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('klyiatech');
    setPassword('klyia123456');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 py-4">
        {/* Prominent Customer Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <HFCLogo variant="full" size="lg" className="hover:scale-102 transition-transform duration-200" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Authorized Mandi Wholesale &amp; Digital Khata Terminal</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 font-heading">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure business administrative access for {DEFAULT_COMPANY_PROFILE.shortName}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. klyiatech"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-600">Default First-Login:</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  klyiatech / klyia123456
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Fill</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Information Area (Compact & Professional) */}
        <div className="mt-5 p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-2xs text-xs text-slate-600 space-y-2.5">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold text-slate-800">{DEFAULT_COMPANY_PROFILE.name}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">{DEFAULT_COMPANY_PROFILE.address}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <a href={`tel:${DEFAULT_COMPANY_PROFILE.phone1}`} className="font-semibold text-slate-700 hover:text-emerald-700">
                {DEFAULT_COMPANY_PROFILE.phone1}
              </a>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{DEFAULT_COMPANY_PROFILE.phone2} ({DEFAULT_COMPANY_PROFILE.phone2Label})</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{DEFAULT_COMPANY_PROFILE.phone3} ({DEFAULT_COMPANY_PROFILE.phone3Label})</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <a href={`mailto:${DEFAULT_COMPANY_PROFILE.email}`} className="hover:text-emerald-700 transition-colors font-medium">
              {DEFAULT_COMPANY_PROFILE.email}
            </a>
          </div>
        </div>

        {/* Software Provider Footer */}
        <div className="text-center text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1.5">
          <span>{DEFAULT_COMPANY_PROFILE.softwareProvider}</span>
          <span>&bull;</span>
          <span>Mandi Terminal Edition</span>
        </div>
      </div>
    </div>
  );
};
