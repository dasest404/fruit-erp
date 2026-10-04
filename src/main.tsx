import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };


  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Klyia FreshERP Runtime Error]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    localStorage.removeItem('klyia_fresh_erp_token');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl mb-4">
            ⚠️
          </div>
          <h1 className="text-xl font-bold font-heading">Klyia FreshERP Recovery Mode</h1>
          <p className="text-xs text-slate-400 max-w-md mt-2">
            A temporary display error occurred while rendering the workspace:
          </p>
          <pre className="mt-3 p-3 bg-slate-800/80 rounded-xl text-[11px] text-rose-300 font-mono max-w-lg overflow-x-auto text-left border border-slate-700">
            {this.state.error?.message || 'Unknown runtime error'}
          </pre>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              Reload Workspace
            </button>
            <button
              onClick={this.handleResetSession}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer border border-slate-700"
            >
              Sign In Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);

