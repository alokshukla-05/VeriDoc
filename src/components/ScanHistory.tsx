import React, { useState } from 'react';
import {
  History,
  Trash2,
  Eye,
  Download,
  Calendar,
  FileText,
  Printer,
  Search,
  Filter,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { ScanResult } from '../types';
import { exportBatchSummaryCSV, downloadPrintableHtml } from '../utils/citationExporter';

interface ScanHistoryProps {
  history: ScanResult[];
  onSelectResult: (result: ScanResult) => void;
  onClearHistory: () => void;
  onDeleteScan: (id: string) => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  history,
  onSelectResult,
  onClearHistory,
  onDeleteScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'clean' | 'flagged'>('all');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Compute aggregate statistics safely
  const totalScans = history.length;
  const avgSimilarity = totalScans > 0
    ? Math.round(history.reduce((acc, h) => acc + (h.overallSimilarityPercent || 0), 0) / totalScans)
    : 0;
  const avgOriginality = totalScans > 0
    ? Math.round(history.reduce((acc, h) => acc + (h.originalityScorePercent || 0), 0) / totalScans)
    : 100;
  const totalCitations = history.reduce((acc, h) => acc + (h.citations?.length || 0), 0);

  // Filter history items safely
  const filteredHistory = history.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = (item.documentTitle || '').toLowerCase().includes(q);
      const matchesLevel = (item.academicLevel || '').toLowerCase().includes(q);
      const matchesVerdict = (item.integrityVerdict || '').toLowerCase().includes(q);
      if (!matchesTitle && !matchesLevel && !matchesVerdict) return false;
    }

    if (filterSeverity === 'clean') {
      return (item.overallSimilarityPercent || 0) <= 15;
    }
    if (filterSeverity === 'flagged') {
      return (item.overallSimilarityPercent || 0) > 15;
    }

    return true;
  });

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center mx-auto text-teal-400">
          <History className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">No Scan History Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Completed academic integrity audits, batch scans, and citation verifications will be automatically recorded here for rapid review, comparison, and print export.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-1 sm:px-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            <span>Audit History & Archived Reports ({history.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track student revisions over time, reopen previous integrity reports, or export records to CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportBatchSummaryCSV(history)}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export Archive CSV</span>
          </button>

          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Aggregate Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Audits</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {totalScans}
          </span>
          <span className="text-[10px] text-slate-500">Archived papers</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Average Similarity</span>
          <span className={`text-2xl font-bold font-mono mt-1 block ${avgSimilarity > 20 ? 'text-rose-400' : avgSimilarity > 10 ? 'text-amber-400' : 'text-teal-400'}`}>
            {avgSimilarity}%
          </span>
          <span className="text-[10px] text-slate-500">Across all submissions</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Average Originality</span>
          <span className="text-2xl font-bold font-mono text-teal-400 mt-1 block">
            {avgOriginality}%
          </span>
          <span className="text-[10px] text-slate-500">Original scholarship</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Citations Audited</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
            {totalCitations}
          </span>
          <span className="text-[10px] text-slate-500">Cross-verified references</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, level, or verdict..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-slate-400">Filter:</span>
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilterSeverity('clean')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === 'clean'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            ≤ 15% Sim
          </button>
          <button
            onClick={() => setFilterSeverity('flagged')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === 'flagged'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            &gt; 15% Sim
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">
              No Records Match Filter
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try clearing your search query or selecting &quot;All&quot; to view all scan reports.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate max-w-lg" title={item.documentTitle}>
                    {item.documentTitle}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                    {item.academicLevel.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      (item.integrityVerdict && item.integrityVerdict.includes('High')) ||
                      (item.overallSimilarityPercent || 0) > 20 ||
                      (item.aiWritingScorePercent || 0) > 40
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : (item.integrityVerdict && item.integrityVerdict.includes('Significant')) ||
                          (item.overallSimilarityPercent || 0) > 10 ||
                          (item.aiWritingScorePercent || 0) > 20
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : 'bg-teal-950/80 text-teal-300 border border-teal-800/60'
                    }`}
                  >
                    {item.integrityVerdict || `${item.overallSimilarityPercent}% Overlap`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.scanTimestamp ? new Date(item.scanTimestamp).toLocaleString() : 'Recent'}</span>
                  </span>
                  <span>·</span>
                  <span className="font-mono">{(item.wordCount || 0).toLocaleString()} words</span>
                  <span>·</span>
                  <span className="text-cyan-400 font-mono font-medium">{item.aiWritingScorePercent ?? 0}% AI</span>
                  <span>·</span>
                  <span>{(item.citations?.length || 0)} Citations Audited</span>
                  {item.rubric && (
                    <>
                      <span>·</span>
                      <span className="text-teal-400 font-mono font-semibold">
                        Grade {item.rubric.letterGrade} ({item.rubric.totalScore}%)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Metrics & Actions */}
              <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                <div className="text-right pr-2">
                  <div className="text-sm font-bold font-mono">
                    <span
                      className={
                        (item.overallSimilarityPercent || 0) > 20
                          ? 'text-rose-400'
                          : (item.overallSimilarityPercent || 0) > 10
                          ? 'text-amber-400'
                          : 'text-teal-400'
                      }
                    >
                      {item.overallSimilarityPercent ?? 0}%
                    </span>
                    <span className="text-xs text-slate-400 font-normal ml-1">Sim.</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    {item.aiWritingScorePercent ?? 0}% AI · {item.originalityScorePercent ?? 100}% Human
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectResult(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    title="Open full interactive audit report"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Report</span>
                  </button>

                  <button
                    onClick={() => {
                      downloadPrintableHtml(item);
                      setDownloadedId(item.id);
                      setTimeout(() => setDownloadedId(null), 2500);
                    }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
                    title="Download printable standalone HTML report"
                  >
                    {downloadedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-[11px] text-teal-300 font-medium hidden sm:inline">Downloaded</span>
                      </>
                    ) : (
                      <Printer className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteScan(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete record from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  );
};
