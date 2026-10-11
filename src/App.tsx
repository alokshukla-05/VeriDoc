import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RawTextScan } from './components/RawTextScan';
import { BulkUpload } from './components/BulkUpload';
import { ScanReportView } from './components/ScanReportView';
import { ScanHistory } from './components/ScanHistory';
import { DocumentQueueItem, ScanResult, AcademicLevel } from './types';

const STORAGE_KEY = 'veridoc_scan_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'bulk' | 'report' | 'history'>('text');
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [queue, setQueue] = useState<DocumentQueueItem[]>([]);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('undergraduate');
  const [isScanning, setIsScanning] = useState(false);

  // Safe localStorage saver that avoids browser QuotaExceededError
  const safeSaveHistory = (items: ScanResult[]) => {
    for (let count = items.length; count >= 1; count--) {
      try {
        const slice = items.slice(0, count);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
        return;
      } catch {
        // Quota fallback: truncate scannedText to avoid quota overflow
        try {
          const lightweight = items.slice(0, count).map((item) => ({
            ...item,
            scannedText: item.scannedText?.slice(0, 3000) || '',
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
          return;
        } catch {
          // retry smaller slice
        }
      }
    }
  };

  // Load history from localStorage (purging any legacy mock sample records)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Keep exclusively authentic user-performed scans (remove predefined/sample artifacts)
          const genuineUserScans = parsed.filter((item) => item && !item.id?.startsWith('sample-'));
          setHistory(genuineUserScans);
          safeSaveHistory(genuineUserScans);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load scan history:', e);
    }
    // Clean initial state with zero predefined mock data
    setHistory([]);
  }, []);

  // Save history to state and localStorage
  const saveToHistory = (newResult: ScanResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== newResult.id);
      const updated = [newResult, ...filtered].slice(0, 50);
      safeSaveHistory(updated);
      return updated;
    });
  };

  const handleScanComplete = (result: ScanResult) => {
    setCurrentResult(result);
    saveToHistory(result);
    setActiveTab('report');
  };

  const handleViewReport = (result: ScanResult) => {
    setCurrentResult(result);
    saveToHistory(result);
    setActiveTab('report');
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {}
  };

  const handleDeleteScan = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSaveHistory(updated);
      return updated;
    });
    if (currentResult?.id === id) {
      setCurrentResult(null);
      if (activeTab === 'report') {
        setActiveTab('text');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={queue.length}
        hasActiveReport={Boolean(currentResult)}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'text' && (
          <RawTextScan
            onScanComplete={handleScanComplete}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkUpload
            queue={queue}
            setQueue={setQueue}
            onViewReport={handleViewReport}
            onSaveToHistory={saveToHistory}
            academicLevel={academicLevel}
            setAcademicLevel={setAcademicLevel}
          />
        )}

        {activeTab === 'report' && currentResult && (
          <ScanReportView
            result={currentResult}
            onBackToNewScan={() => setActiveTab('text')}
          />
        )}

        {activeTab === 'history' && (
          <ScanHistory
            history={history}
            onSelectResult={handleViewReport}
            onClearHistory={handleClearHistory}
            onDeleteScan={handleDeleteScan}
          />
        )}
      </main>

      {/* Quiet Academic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">VeriDoc Academic™</span>
            <span>·</span>
            <span>Plagiarism Detection & Citation Intelligence Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>APA 7th · MLA 9th · Chicago 17th · IEEE · Harvard · BibTeX</span>
            <span>·</span>
            <span>Unlimited Document Size & Pages</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
