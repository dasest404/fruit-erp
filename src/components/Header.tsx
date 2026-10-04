import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Sparkles,
  Calendar,
  ChevronDown,
  LogOut,
  Key,
  X,
  AlertTriangle,
  Info,
  Menu,
} from 'lucide-react';
import { ERPDataStore, AppNotification, NavigationSection } from '../types';
import { formatDate, formatINR } from '../utils/formatters';
import { UpperNavigation, NavigationOptions } from './UpperNavigation';

interface HeaderProps {
  data: ERPDataStore | null;
  currentSection: NavigationSection;
  onNavigate: (
    section: NavigationSection,
    customerId?: string,
    supplierId?: string,
    options?: NavigationOptions
  ) => void;
  onOpenSearch: () => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase?: () => void;
  onOpenAI: () => void;
  onLogout: () => void;
  onChangePasswordClick: () => void;
  onNotificationClick: (notif: AppNotification) => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  currentSection,
  onNavigate,
  onOpenSearch,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenAI,
  onLogout,
  onChangePasswordClick,
  onNotificationClick,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const todayFormatted = formatDate(new Date().toISOString());

  // Quick APMC Top-Bar Metrics
  const todayIso = new Date().toISOString().split('T')[0];
  const todaySales = (data?.sales || []).filter((s) => s.saleDate.startsWith(todayIso));
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

  const todayCollections = (data?.customerPayments || []).filter((p) => p.paymentDate.startsWith(todayIso));
  const todayCashSales = todaySales.filter((s) => s.paymentMethod === 'Cash' || s.paymentMethod === 'UPI');
  const todayCollectionsTotal =
    todayCollections.reduce((sum, p) => sum + p.amount, 0) +
    todayCashSales.reduce((sum, s) => sum + s.paidAmount, 0);

  const totalOutstandingBalance = (data?.customers || []).reduce(
    (sum, c) => sum + (c.outstandingBalance || 0),
    0
  );

  return (
    <header className="sticky top-0 z-30 w-full max-w-full bg-white border-b border-slate-200/90 shadow-2xs select-none box-border">
      {/* ========================================================================= */}
      {/* TIER 1: EXECUTIVE COMMAND BAR                                             */}
      {/* ========================================================================= */}
      <div className="w-full max-w-full px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 sm:gap-4 box-border">
        {/* Left: Mobile Drawer Button + Application Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer text-left group min-w-0"
            title="Go to Dashboard - Hari Kripa Fruit Company"
          >
            <div className="w-8 h-8 rounded-full shadow-2xs shrink-0 group-hover:scale-105 transition-transform overflow-hidden bg-white border border-amber-200/80">
              <img src="/assets/hfc-emblem.svg" alt="HFC" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 font-heading truncate max-w-[150px] sm:max-w-[220px]">
                  {data?.settings?.businessName || 'Hari Kripa Fruit Company'}
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 font-bold truncate hidden sm:block max-w-[150px] sm:max-w-[200px]">
                {data?.settings?.tagline || 'FRESHNESS • QUALITY • TRUST'}
              </p>
            </div>
          </button>
        </div>

        {/* Center: Global Search Trigger */}
        <div className="flex items-center gap-2 flex-1 max-w-xs md:max-w-sm mx-1 sm:mx-2 min-w-0">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs text-slate-500 transition-all cursor-pointer shadow-2xs group min-w-0"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
              <span className="font-medium truncate">Search fruits, bills, khata...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Center: Live APMC Mandi Metrics (Desktop Wide) */}
        <div className="hidden xl:flex items-center gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-100 text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Daily Sales:</span>
            <span className="font-extrabold font-mono">{formatINR(todaySalesTotal)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-100 text-blue-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Today's In:</span>
            <span className="font-extrabold font-mono">{formatINR(todayCollectionsTotal)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-100 text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Receivable:</span>
            <span className="font-extrabold font-mono">{formatINR(totalOutstandingBalance)}</span>
          </div>
        </div>

        {/* Far Right: Actions, Date, Alerts & Account */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Today's Date Badge */}
          <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{todayFormatted}</span>
          </div>

          {/* + Purchase Action */}
          {onOpenNewPurchase && (
            <button
              onClick={onOpenNewPurchase}
              className="hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold transition-all border border-slate-200/70 cursor-pointer shadow-2xs"
              title="Record Inward Fruit Lot"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>+ Purchase</span>
            </button>
          )}

          {/* + Sale Action */}
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
            title="Create New Wholesale Bill"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Sale</span>
          </button>

          {/* FreshERP AI Trigger */}
          <button
            onClick={onOpenAI}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
            title="FreshERP AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
            <span className="hidden xl:inline">AI Help</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">ERP Business Alerts</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No active alerts. All business systems nominal.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onNotificationClick(n);
                          setShowNotifications(false);
                        }}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                          !n.read ? 'bg-slate-50/70' : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                            n.severity === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : n.severity === 'error'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {n.severity === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 leading-snug">{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block">{formatDate(n.date)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account Menu (Mobile & Desktop) */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                K
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{data?.user.username || 'Admin'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{data?.settings.businessName}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onChangePasswordClick();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change Password</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 2: UPPER DROPDOWN NAVIGATION MENU RIBBON                             */}
      {/* ========================================================================= */}
      <UpperNavigation
        currentSection={currentSection}
        onNavigate={onNavigate}
        data={data}
        onChangePasswordClick={onChangePasswordClick}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        onOpenAI={onOpenAI}
      />
    </header>
  );
};
