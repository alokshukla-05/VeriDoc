import React from 'react';
import { ShieldCheck, FileText, Layers, History, Award } from 'lucide-react';

interface HeaderProps {
  activeTab: 'text' | 'bulk' | 'report' | 'history';
  setActiveTab: (tab: 'text' | 'bulk' | 'report' | 'history') => void;
  queueCount: number;
  hasActiveReport: boolean;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  hasActiveReport,
  historyCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 sm:py-0 sm:h-16 gap-2.5 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-base sm:text-lg text-white tracking-tight">VeriDoc</span>
                  <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800/60 uppercase tracking-wider">
                    Academic
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Turnitin-Grade Originality Detection · Citation Audit · Multi-Document Engine
                </p>
              </div>
            </div>

            {/* Mobile quick indicator */}
            {hasActiveReport && (
              <div className="sm:hidden flex items-center gap-1 text-[11px] text-teal-400 font-medium bg-teal-950/50 px-2 py-0.5 rounded-full border border-teal-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>Report Ready</span>
              </div>
            )}
          </div>

          {/* Navigation tabs - horizontally scrollable on mobile */}
          <nav className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800/90 rounded-xl overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === 'text'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Direct Text</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 relative ${
                activeTab === 'bulk'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Bulk Uploads</span>
              {queueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-teal-500 text-white">
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('report')}
              disabled={!hasActiveReport}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === 'report'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : hasActiveReport
                  ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={hasActiveReport ? 'View active scan report' : 'Run a scan first to view report'}
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Integrity Report</span>
              {hasActiveReport && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === 'history'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">({historyCount})</span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
