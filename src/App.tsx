import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { ERPDataStore, NavigationSection, Sale } from './types';
import { LoginScreen } from './components/LoginScreen';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { MoreMenuModal } from './components/MoreMenuModal';
import { Header } from './components/Header';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { InvoiceModal } from './components/InvoiceModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { SalesView } from './components/views/SalesView';
import { PurchasesView } from './components/views/PurchasesView';
import { StockView } from './components/views/StockView';
import { CustomersView } from './components/views/CustomersView';
import { SuppliersView } from './components/views/SuppliersView';
import { FruitsView } from './components/views/FruitsView';
import { DailyRatesView } from './components/views/DailyRatesView';
import { ExpensesView } from './components/views/ExpensesView';
import { WastageView } from './components/views/WastageView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

// Path to navigation section mapping for direct URL navigation
const PATH_TO_SECTION_MAP: Record<string, NavigationSection> = {
  '': 'dashboard',
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/customers': 'customers',
  '/khata': 'customers',
  '/suppliers': 'suppliers',
  '/supplier-payments': 'suppliers',
  '/products': 'fruits',
  '/fruits': 'fruits',
  '/fruit-master': 'fruits',
  '/sales': 'sales',
  '/billing': 'sales',
  '/bill': 'sales',
  '/purchase': 'purchases',
  '/purchases': 'purchases',
  '/inventory': 'stock',
  '/stock': 'stock',
  '/rates': 'rates',
  '/daily-rates': 'rates',
  '/expenses': 'expenses',
  '/wastage': 'wastage',
  '/reports': 'reports',
  '/settings': 'settings',
};

const SECTION_TO_CANONICAL_PATH: Record<NavigationSection, string> = {
  dashboard: '/dashboard',
  sales: '/sales',
  purchases: '/purchases',
  stock: '/inventory',
  customers: '/customers',
  suppliers: '/suppliers',
  fruits: '/fruit-master',
  rates: '/rates',
  expenses: '/expenses',
  wastage: '/wastage',
  reports: '/reports',
  settings: '/settings',
};

// Helper to read initial navigation from URL pathname, query, or local storage
const getInitialNavState = (): {
  section: NavigationSection;
  customerId?: string;
  supplierId?: string;
} => {
  try {
    const rawPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section') as NavigationSection | null;
    const validSections: NavigationSection[] = [
      'dashboard',
      'sales',
      'purchases',
      'stock',
      'customers',
      'suppliers',
      'fruits',
      'rates',
      'expenses',
      'wastage',
      'reports',
      'settings',
    ];

    let targetSec: NavigationSection = 'dashboard';
    if (PATH_TO_SECTION_MAP[rawPath]) {
      targetSec = PATH_TO_SECTION_MAP[rawPath];
    } else if (sec && validSections.includes(sec)) {
      targetSec = sec;
    }

    const cId =
      params.get('customerId') ||
      (targetSec === 'customers' ? localStorage.getItem('fresherp_selected_customer_id') : null) ||
      undefined;
    const sId =
      params.get('supplierId') ||
      (targetSec === 'suppliers' ? localStorage.getItem('fresherp_selected_supplier_id') : null) ||
      undefined;
    return { section: targetSec, customerId: cId, supplierId: sId };
  } catch {
    return { section: 'dashboard', customerId: undefined, supplierId: undefined };
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(api.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isForcePasswordChangeOpen, setIsForcePasswordChangeOpen] = useState(false);

  // Data Store
  const [data, setData] = useState<ERPDataStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation with URL and localStorage synchronization
  const [initialNav] = useState(getInitialNavState);
  const [currentSection, setCurrentSection] = useState<NavigationSection>(initialNav.section);

  // Modals & Overlays
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [viewingInvoiceSale, setViewingInvoiceSale] = useState<Sale | null>(null);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [reportsActiveTab, setReportsActiveTab] = useState<'pnl' | 'fruits' | 'aging'>('pnl');

  // Cross-view context pointers (synced on refresh)
  const [initialCustomerIdForKhata, setInitialCustomerIdForKhata] = useState<string | undefined>(
    initialNav.customerId
  );
  const [initialSupplierIdForView, setInitialSupplierIdForView] = useState<string | undefined>(
    initialNav.supplierId
  );

  // Helper to synchronize URL query parameters, paths, and local storage
  const updateUrl = (sec: NavigationSection, custId?: string, supId?: string) => {
    try {
      const canonicalPath = SECTION_TO_CANONICAL_PATH[sec] || `/${sec}`;
      const params = new URLSearchParams();
      if (sec === 'customers' && custId) {
        params.set('customerId', custId);
        localStorage.setItem('fresherp_selected_customer_id', custId);
      } else if (sec === 'customers') {
        localStorage.removeItem('fresherp_selected_customer_id');
      }
      if (sec === 'suppliers' && supId) {
        params.set('supplierId', supId);
        localStorage.setItem('fresherp_selected_supplier_id', supId);
      } else if (sec === 'suppliers') {
        localStorage.removeItem('fresherp_selected_supplier_id');
      }
      const q = params.toString();
      const newUrl = q ? `${canonicalPath}?${q}` : canonicalPath;
      window.history.pushState(null, '', newUrl);
    } catch (e) {
      console.error('Failed to sync URL:', e);
    }
  };

  // Browser back/forward button support
  useEffect(() => {
    const handlePopState = () => {
      const state = getInitialNavState();
      setCurrentSection(state.section);
      setInitialCustomerIdForKhata(state.customerId);
      setInitialSupplierIdForView(state.supplierId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global unauthorized event handler (auto-switch to Login screen immediately)
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setData(null);
      setError(null);
    };
    window.addEventListener('klyia:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('klyia:unauthorized', handleUnauthorized);
  }, []);

  // Fetch ERP Data
  const loadERPData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getData();
      setData(res);
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      const isAuthIssue =
        msg.includes('unauthorized') ||
        msg.includes('session') ||
        msg.includes('expired') ||
        msg.includes('sign in') ||
        msg.includes('authentication') ||
        !api.isAuthenticated();

      if (isAuthIssue) {
        console.warn('Authentication session revalidating or expired.');
        setIsAuthenticated(false);
        setData(null);
        setError(null);
      } else {
        console.error('Failed to load ERP data:', err);
        setError(err.message || 'Failed to connect to Klyia FreshERP backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If not authenticated and not explicitly logged out, seamlessly auto-authenticate with default credentials
    if (!isAuthenticated && !api.isExplicitlyLoggedOut()) {
      api
        .login({ username: 'klyiatech', password: 'klyia123456' })
        .then((res) => {
          setIsAuthenticated(true);
          setCurrentUser(res);
        })
        .catch(() => {
          setLoading(false);
        });
    } else if (isAuthenticated) {
      loadERPData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Keyboard shortcut for Cmd+K / Ctrl+K global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Login Success
  const handleLoginSuccess = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    // Directly log in without forcing password change modal
    setIsForcePasswordChangeOpen(false);
  };

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    try {
      sessionStorage.removeItem('klyia_dashboard_unlocked');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setData(null);
    setError(null);
    setCurrentSection('dashboard');
  };

  // If not authenticated, display the focused single-client Login Screen
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading Screen
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/10 animate-pulse">
          🍏
        </div>
        <p className="mt-4 text-white font-black tracking-tight text-base font-heading">
          Klyia FreshERP
        </p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Wholesale Core Engine...</p>
      </div>
    );
  }

  // Connection Error Screen
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-4">
          ⚠️
        </div>
        <h2 className="text-lg font-bold text-slate-900">Backend System Connection Notice</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">{error}</p>
        <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
          <button
            onClick={loadERPData}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            Retry Connection
          </button>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  const handleNavigateSection = (
    sec: any,
    customerId?: string,
    supplierId?: string,
    options?: { openModal?: boolean; reportsTab?: 'pnl' | 'fruits' | 'aging' }
  ) => {
    let targetSection: NavigationSection = 'dashboard';
    if (sec === 'khata') {
      targetSection = 'customers';
    } else if (sec === 'supplier-payments') {
      targetSection = 'suppliers';
    } else {
      targetSection = sec as NavigationSection;
    }

    if (targetSection === 'sales') {
      setSaleModalOpen(Boolean(options?.openModal));
    } else if (targetSection === 'purchases') {
      setPurchaseModalOpen(Boolean(options?.openModal));
    } else if (targetSection === 'reports' && options?.reportsTab) {
      setReportsActiveTab(options.reportsTab);
    }

    setCurrentSection(targetSection);
    setInitialCustomerIdForKhata(customerId);
    setInitialSupplierIdForView(supplierId);
    updateUrl(targetSection, customerId, supplierId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased w-full max-w-full overflow-x-hidden selection:bg-emerald-500 selection:text-white box-border">
      {/* Full-Width Top Header + Upper Menu Ribbon */}
      <Header
        data={data}
        currentSection={currentSection}
        onNavigate={handleNavigateSection}
        onOpenSearch={() => setIsGlobalSearchOpen(true)}
        onOpenNewSale={() => handleNavigateSection('sales', undefined, undefined, { openModal: true })}
        onOpenNewPurchase={() => handleNavigateSection('purchases', undefined, undefined, { openModal: true })}
        onOpenAI={() => setIsAiAssistantOpen(true)}
        onLogout={handleLogout}
        onChangePasswordClick={() => setIsForcePasswordChangeOpen(true)}
        onNotificationClick={(notif) => {
          if (notif.linkSection) {
            if (notif.linkSection === 'customers' && notif.actionTargetId) {
              handleNavigateSection('customers', notif.actionTargetId);
            } else if (notif.linkSection === 'suppliers' && notif.actionTargetId) {
              handleNavigateSection('suppliers', undefined, notif.actionTargetId);
            } else {
              handleNavigateSection(notif.linkSection);
            }
          } else if (notif.type === 'low_stock') {
            handleNavigateSection('fruits');
          } else if (notif.type === 'payment_due' || notif.category === 'payment_overdue') {
            handleNavigateSection('customers');
          }
        }}
      />

      {/* Main Content Area: 100% available viewport width, zero horizontal scrolling */}
      <div className="flex-1 w-full max-w-full flex flex-col min-w-0 box-border">
        <main className="flex-1 w-full max-w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 box-border min-w-0">
          {currentSection === 'dashboard' && (
            <DashboardView
              data={data}
              onNavigate={handleNavigateSection}
              onOpenNewSale={() => handleNavigateSection('sales', undefined, undefined, { openModal: true })}
              onOpenNewPurchase={() => handleNavigateSection('purchases', undefined, undefined, { openModal: true })}
              onOpenNewCustomer={() => setCurrentSection('customers')}
              onViewInvoice={(sale) => setViewingInvoiceSale(sale)}
              onOpenAI={() => setIsAiAssistantOpen(true)}
            />
          )}

          {currentSection === 'sales' && (
            <SalesView
              data={data}
              onRefreshData={loadERPData}
              onViewInvoice={(sale) => setViewingInvoiceSale(sale)}
              initialCreateModalOpen={saleModalOpen}
            />
          )}

          {currentSection === 'purchases' && (
            <PurchasesView
              data={data}
              onRefreshData={loadERPData}
              initialCreateModalOpen={purchaseModalOpen}
            />
          )}

          {currentSection === 'stock' && (
            <StockView
              data={data}
              onRefreshData={loadERPData}
              onOpenWastage={() => setCurrentSection('wastage')}
              onOpenNewPurchase={() => setCurrentSection('purchases')}
            />
          )}

          {currentSection === 'customers' && (
            <CustomersView
              data={data}
              onRefreshData={loadERPData}
              initialCustomerId={initialCustomerIdForKhata}
              onCustomerSelect={(custId) => {
                setInitialCustomerIdForKhata(custId);
                updateUrl('customers', custId, undefined);
              }}
              onViewInvoice={(sale) => setViewingInvoiceSale(sale)}
              onOpenNewSaleForCustomer={(custId) => {
                setCurrentSection('sales');
              }}
            />
          )}

          {currentSection === 'suppliers' && (
            <SuppliersView
              data={data}
              onRefreshData={loadERPData}
              initialSupplierId={initialSupplierIdForView}
              onSupplierSelect={(supId) => {
                setInitialSupplierIdForView(supId);
                updateUrl('suppliers', undefined, supId);
              }}
            />
          )}

          {currentSection === 'fruits' && (
            <FruitsView
              data={data}
              onRefreshData={loadERPData}
            />
          )}

          {currentSection === 'rates' && (
            <DailyRatesView
              data={data}
              onRefreshData={loadERPData}
            />
          )}

          {currentSection === 'expenses' && (
            <ExpensesView
              data={data}
              onRefreshData={loadERPData}
            />
          )}

          {currentSection === 'wastage' && (
            <WastageView
              data={data}
              onRefreshData={loadERPData}
            />
          )}

          {currentSection === 'reports' && (
            <ReportsView
              data={data}
              initialTab={reportsActiveTab}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsView
              data={data}
              onRefreshData={loadERPData}
              onLogout={handleLogout}
              onOpenChangePassword={() => setIsForcePasswordChangeOpen(true)}
            />
          )}
          {/* Fallback to Dashboard if any unrecognized section */}
          {!['dashboard', 'sales', 'purchases', 'stock', 'customers', 'suppliers', 'fruits', 'rates', 'expenses', 'wastage', 'reports', 'settings'].includes(currentSection) && (
            <DashboardView
              data={data}
              onNavigate={handleNavigateSection}
              onOpenNewSale={() => setCurrentSection('sales')}
              onOpenNewPurchase={() => setCurrentSection('purchases')}
              onOpenNewCustomer={() => setCurrentSection('customers')}
              onViewInvoice={(sale) => setViewingInvoiceSale(sale)}
              onOpenAI={() => setIsAiAssistantOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile/tablet) */}
      <BottomNav
        activeSection={currentSection as any}
        onSelectSection={handleNavigateSection}
        onOpenMore={() => setIsMoreMenuOpen(true)}
        lowStockCount={data?.stock?.filter((s) => s.weightKg <= 300)?.length || 0}
      />

      {/* More Menu Drawer for Mobile */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        activeSection={currentSection as any}
        onSelectSection={(sec) => {
          handleNavigateSection(sec);
          setIsMoreMenuOpen(false);
        }}
        onOpenAI={() => {
          setIsMoreMenuOpen(false);
          setIsAiAssistantOpen(true);
        }}
        onLogout={() => {
          setIsMoreMenuOpen(false);
          handleLogout();
        }}
        businessName={data?.settings?.businessName}
      />

      {/* Global Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        data={data}
        onNavigate={handleNavigateSection}
        onSelectCustomer={(c) => {
          handleNavigateSection('customers', c.id);
        }}
        onSelectSupplier={(s) => {
          handleNavigateSection('suppliers', undefined, s.id);
        }}
        onSelectFruit={() => {
          handleNavigateSection('fruits');
        }}
        onSelectSale={(s) => {
          setViewingInvoiceSale(s);
        }}
      />

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        data={data}
        onRefreshData={loadERPData}
        onNavigateToSection={(section, targetId) => {
          if (section === 'customers') {
            handleNavigateSection('customers', targetId);
          } else if (section === 'suppliers') {
            handleNavigateSection('suppliers', undefined, targetId);
          } else {
            handleNavigateSection(section);
          }
        }}
      />

      {/* Printable / Shareable Invoice Modal */}
      {viewingInvoiceSale && data?.settings && (
        <InvoiceModal
          isOpen={true}
          sale={viewingInvoiceSale}
          settings={data.settings}
          customerPhone={data?.customers?.find((c) => c.id === viewingInvoiceSale.customerId)?.phone}
          onClose={() => setViewingInvoiceSale(null)}
        />
      )}

      {/* Change Password Modal (if opened from Settings) */}
      {isForcePasswordChangeOpen && (
        <ForcePasswordChangeModal
          isOpen={isForcePasswordChangeOpen}
          onClose={() => setIsForcePasswordChangeOpen(false)}
          onSuccess={() => setIsForcePasswordChangeOpen(false)}
          onPasswordChanged={() => {
            setIsForcePasswordChangeOpen(false);
          }}
        />
      )}
    </div>
  );
}
