import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  Package,
  Apple,
  TrendingUp,
  Trash2,
  BookOpen,
  CreditCard,
  Truck,
  Wallet,
  Clock,
  Layers,
  Users,
  Building,
  BarChart3,
  DollarSign,
  Settings,
  Database,
  Key,
  ChevronDown,
  X,
  FileText,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { NavigationSection, ERPDataStore } from '../types';

export interface NavigationOptions {
  openModal?: boolean;
  reportsTab?: 'pnl' | 'fruits' | 'aging';
}

interface UpperNavigationProps {
  currentSection: NavigationSection;
  onNavigate: (
    section: NavigationSection,
    customerId?: string,
    supplierId?: string,
    options?: NavigationOptions
  ) => void;
  data: ERPDataStore | null;
  onChangePasswordClick: () => void;
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  onOpenAI: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string | number;
  badgeColor?: string;
  description?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeSections: NavigationSection[];
  items?: MenuItem[];
  directSection?: NavigationSection;
}

export const UpperNavigation: React.FC<UpperNavigationProps> = ({
  currentSection,
  onNavigate,
  data,
  onChangePasswordClick,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  onOpenAI,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Badge counts
  const lowStockCount = data?.stock.filter((s) => s.weightKg <= 300).length || 0;
  const overdueCustomersCount =
    data?.customers.filter((c) => (c.outstandingBalance || 0) > (c.creditLimit || 0)).length || 0;

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        onCloseMobileDrawer();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCloseMobileDrawer]);

  // Menu Groups Hierarchy
  const menuGroups: MenuGroup[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      activeSections: ['dashboard'],
      directSection: 'dashboard',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <Receipt className="w-4 h-4" />,
      activeSections: ['sales', 'purchases'],
      items: [
        {
          id: 'new-sale',
          label: 'New Wholesale Sale (POS)',
          icon: <Plus className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => onNavigate('sales', undefined, undefined, { openModal: true }),
          description: 'Cash memo & wholesale invoice',
        },
        {
          id: 'sales-history',
          label: 'Sales Invoices & Register',
          icon: <Receipt className="w-3.5 h-3.5 text-slate-500" />,
          action: () => onNavigate('sales', undefined, undefined, { openModal: false }),
          description: 'View & print billed sales orders',
        },
        {
          id: 'new-purchase',
          label: 'Record Inward Purchase Lot',
          icon: <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />,
          action: () => onNavigate('purchases', undefined, undefined, { openModal: true }),
          description: 'Inward mandi fruit truck delivery',
        },
        {
          id: 'purchase-history',
          label: 'Purchase History & Inward Lots',
          icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
          action: () => onNavigate('purchases', undefined, undefined, { openModal: false }),
          description: 'Inward lot receipts & landing costs',
        },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Package className="w-4 h-4" />,
      activeSections: ['stock', 'fruits', 'rates', 'wastage'],
      items: [
        {
          id: 'stock-master',
          label: 'Stock Master & Valuation',
          icon: <Package className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => onNavigate('stock'),
          badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
          description: 'Live KG, crates & average cost',
        },
        {
          id: 'fruit-master',
          label: 'Fruit Master Catalog',
          icon: <Apple className="w-3.5 h-3.5 text-rose-500" />,
          action: () => onNavigate('fruits'),
          description: 'Fruit varieties, photo icons & default rates',
        },
        {
          id: 'daily-rates',
          label: 'Daily Mandi Fruit Rates',
          icon: <TrendingUp className="w-3.5 h-3.5 text-blue-600" />,
          action: () => onNavigate('rates'),
          description: 'Set daily prices & WhatsApp broadcast',
        },
        {
          id: 'wastage-tracker',
          label: 'Spoilage & Wastage Tracker',
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
          action: () => onNavigate('wastage'),
          description: 'Damaged, rotten & sorting losses',
        },
      ],
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: <BookOpen className="w-4 h-4" />,
      activeSections: ['customers', 'suppliers', 'reports'],
      items: [
        {
          id: 'customer-khata',
          label: 'Customer Digital Khata',
          icon: <BookOpen className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => onNavigate('customers'),
          badge: overdueCustomersCount > 0 ? `${overdueCustomersCount} Due` : undefined,
          badgeColor: 'bg-rose-100 text-rose-800',
          description: 'Debtor khata balances & statements',
        },
        {
          id: 'customer-ledger',
          label: 'Customer Ledger Statements',
          icon: <CreditCard className="w-3.5 h-3.5 text-blue-600" />,
          action: () => onNavigate('customers'),
          description: 'Debit/credit timeline & payment slips',
        },
        {
          id: 'supplier-ledger',
          label: 'Supplier Khata & Payables',
          icon: <Truck className="w-3.5 h-3.5 text-purple-600" />,
          action: () => onNavigate('suppliers'),
          description: 'Farmer & grower payable ledgers',
        },
        {
          id: 'receivables-aging',
          label: 'Debtor Aging & Overdues',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          action: () => onNavigate('reports', undefined, undefined, { reportsTab: 'aging' }),
          description: 'Credit cycle & payment reminders',
        },
      ],
    },
    {
      id: 'masters',
      label: 'Masters',
      icon: <Layers className="w-4 h-4" />,
      activeSections: ['customers', 'suppliers', 'fruits'],
      items: [
        {
          id: 'customers-dir',
          label: 'Customer Directory',
          icon: <Users className="w-3.5 h-3.5 text-blue-600" />,
          action: () => onNavigate('customers'),
          description: 'Wholesale buyers & retail stores',
        },
        {
          id: 'suppliers-dir',
          label: 'Suppliers & Mandi Growers',
          icon: <Building className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => onNavigate('suppliers'),
          description: 'Farmers, mandi traders & suppliers',
        },
        {
          id: 'fruits-catalog',
          label: 'Fruit Master Catalog',
          icon: <Apple className="w-3.5 h-3.5 text-rose-500" />,
          action: () => onNavigate('fruits'),
          description: 'Central product master, photo icons & pricing',
        },
        {
          id: 'company-profiles',
          label: 'Company Bill Profiles',
          icon: <Building className="w-3.5 h-3.5 text-amber-600" />,
          action: () => onNavigate('settings'),
          description: 'Multi-company profiles, logos, GST & bank details',
        },
      ],
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: <Wallet className="w-4 h-4" />,
      activeSections: ['expenses'],
      items: [
        {
          id: 'all-expenses',
          label: 'Mandi Expenses Register',
          icon: <Wallet className="w-3.5 h-3.5 text-amber-600" />,
          action: () => onNavigate('expenses'),
          description: 'Log and track operational overheads',
        },
        {
          id: 'freight-expenses',
          label: 'Transport & Freight Charges',
          icon: <Truck className="w-3.5 h-3.5 text-blue-600" />,
          action: () => onNavigate('expenses'),
          description: 'Inter-city trucks & local deliveries',
        },
        {
          id: 'labour-expenses',
          label: 'Labour & Hamali Charges',
          icon: <Users className="w-3.5 h-3.5 text-purple-600" />,
          action: () => onNavigate('expenses'),
          description: 'Unloading, sorting & handling',
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      activeSections: ['reports'],
      items: [
        {
          id: 'pnl-report',
          label: 'Profit & Loss Statement (P&L)',
          icon: <DollarSign className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => onNavigate('reports', undefined, undefined, { reportsTab: 'pnl' }),
          description: 'Gross margin, overheads & net profit',
        },
        {
          id: 'fruit-velocity',
          label: 'Fruit Sales & Movement Velocity',
          icon: <TrendingUp className="w-3.5 h-3.5 text-blue-600" />,
          action: () => onNavigate('reports', undefined, undefined, { reportsTab: 'fruits' }),
          description: 'Fast vs slow moving fruit stock',
        },
        {
          id: 'stock-valuation-rep',
          label: 'Warehouse Stock Valuation Report',
          icon: <Package className="w-3.5 h-3.5 text-purple-600" />,
          action: () => onNavigate('stock'),
          description: 'Current floor stock asset value',
        },
        {
          id: 'aging-report',
          label: 'Customer Outstandings & Aging',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          action: () => onNavigate('reports', undefined, undefined, { reportsTab: 'aging' }),
          description: 'Overdue receivables analysis',
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      activeSections: ['settings'],
      items: [
        {
          id: 'biz-settings',
          label: 'Business Settings & APMC Terms',
          icon: <Building className="w-3.5 h-3.5 text-slate-700" />,
          action: () => onNavigate('settings'),
          description: 'Firm profile, GSTIN & invoice notes',
        },
        {
          id: 'sqlite-backup',
          label: 'SQLite Database & Disk Backups',
          icon: <Database className="w-3.5 h-3.5 text-emerald-600" />,
          action: () => onNavigate('settings'),
          description: 'Local database snapshot & restore',
        },
        {
          id: 'change-pw',
          label: 'Administrative Security & Password',
          icon: <Key className="w-3.5 h-3.5 text-amber-600" />,
          action: () => onChangePasswordClick(),
          description: 'Update sign-in password & credentials',
        },
      ],
    },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP / LAPTOP UPPER HORIZONTAL MENU RIBBON                             */}
      {/* ========================================================================= */}
      <nav
        ref={navRef}
        aria-label="Primary Navigation"
        className="hidden lg:block w-full bg-slate-900 border-b border-slate-800 text-white select-none z-30"
      >
        <div className="w-full max-w-full px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 xl:gap-2 h-11 overflow-x-visible">
            {menuGroups.map((group, index) => {
              const isActive = group.activeSections.includes(currentSection);
              const isOpen = openDropdown === group.id;
              const hasDropdown = Boolean(group.items && group.items.length > 0);
              const isRightAligned = index >= menuGroups.length - 2;

              if (!hasDropdown && group.directSection) {
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate(group.directSection!);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{group.icon}</span>
                    <span>{group.label}</span>
                  </button>
                );
              }

              return (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                    onMouseEnter={() => {
                      if (openDropdown !== null) {
                        setOpenDropdown(group.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive || isOpen
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                  >
                    <span>{group.icon}</span>
                    <span>{group.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-white' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Panel */}
                  {isOpen && group.items && (
                    <div
                      className={`absolute top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 min-w-[240px] max-w-[calc(100vw-24px)] sm:max-w-xs ${
                        isRightAligned ? 'right-0' : 'left-0'
                      }`}
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {group.label} Navigation
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 font-semibold">FreshERP</span>
                      </div>

                      <div className="py-0.5 space-y-0.5">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setOpenDropdown(null);
                              item.action();
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase shrink-0 ${
                                      item.badgeColor || 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE & TABLET SLIDE-OUT ACCORDION DRAWER                                */}
      {/* ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-amber-300/80 bg-white">
                  <img src="/assets/hfc-emblem.svg" alt="HFC" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm tracking-tight font-heading text-white truncate">
                    {data?.settings?.businessName || 'Hari Kripa Fruit Company'}
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-bold truncate">
                    {data?.settings?.tagline || 'FRESHNESS • QUALITY • TRUST'}
                  </p>
                </div>
              </div>
              <button
                onClick={onCloseMobileDrawer}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live APMC quick status indicator in drawer */}
            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-800">APMC Mandi Online</span>
              </div>
              <button
                onClick={() => {
                  onCloseMobileDrawer();
                  onOpenAI();
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Help</span>
              </button>
            </div>

            {/* Accordion Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {menuGroups.map((group) => {
                const isActive = group.activeSections.includes(currentSection);
                const hasDropdown = Boolean(group.items && group.items.length > 0);
                const isExpanded = mobileExpandedGroup === group.id;

                if (!hasDropdown && group.directSection) {
                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        onCloseMobileDrawer();
                        onNavigate(group.directSection!);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-500'}>
                        {group.icon}
                      </span>
                      <span>{group.label}</span>
                    </button>
                  );
                }

                return (
                  <div key={group.id} className="rounded-xl overflow-hidden border border-slate-100">
                    <button
                      onClick={() =>
                        setMobileExpandedGroup(isExpanded ? null : group.id)
                      }
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-colors text-left cursor-pointer ${
                        isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-emerald-600' : 'text-slate-500'}>
                          {group.icon}
                        </span>
                        <span>{group.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && group.items && (
                      <div className="bg-slate-50/80 p-1.5 space-y-0.5 border-t border-slate-100">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              onCloseMobileDrawer();
                              item.action();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white hover:text-emerald-700 transition-colors text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-slate-400">{item.icon}</span>
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                                  item.badgeColor || 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer with Quick Password & Account */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-1">
              <button
                onClick={() => {
                  onCloseMobileDrawer();
                  onChangePasswordClick();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Change Password</span>
              </button>
              <p className="pt-2 text-center text-[10px] text-slate-400 font-medium">
                Powered by Klyia Technology
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
