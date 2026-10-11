import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCheck2,
  FileText,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Download,
  Eye,
  FileUp,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { DocumentQueueItem, ScanResult, AcademicLevel } from '../types';
import { parseFileToText, formatBytes } from '../utils/fileParser';
import { exportBatchSummaryCSV } from '../utils/citationExporter';

interface BulkUploadProps {
  queue: DocumentQueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<DocumentQueueItem[]>>;
  onViewReport: (result: ScanResult) => void;
  onSaveToHistory?: (result: ScanResult) => void;
  academicLevel: AcademicLevel;
  setAcademicLevel: (level: AcademicLevel) => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({
  queue,
  setQueue,
  onViewReport,
  onSaveToHistory,
  academicLevel,
  setAcademicLevel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const completedItems = queue.filter((item) => item.status === 'completed' && item.result);
  const pendingItems = queue.filter((item) => item.status === 'queued' || item.status === 'error');

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: DocumentQueueItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `doc-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;

      const queueItem: DocumentQueueItem = {
        id,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        sizeFormatted: formatBytes(file.size),
        rawText: '',
        wordCount: 0,
        status: 'extracting',
        progress: 15,
        addedAt: new Date().toLocaleTimeString(),
      };
      newItems.push(queueItem);
    }

    setQueue((prev) => [...prev, ...newItems]);

    // Parse files asynchronously
    for (const item of newItems) {
      if (!item.file) continue;
      try {
        const parsed = await parseFileToText(item.file);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  rawText: parsed.text,
                  wordCount: parsed.wordCount,
                  status: 'queued',
                  progress: 0,
                }
              : q
          )
        );
      } catch (err: any) {
        console.error(`Error parsing file ${item.title}:`, err);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  errorMessage: err.message || 'File extraction error',
                }
              : q
          )
        );
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    if (isProcessingBatch) return;
    setQueue([]);
  };

  // Run batch scan
  const handleStartBatchScan = async () => {
    if (isProcessingBatch) return;
    setIsProcessingBatch(true);

    const itemsToProcess = queue.filter((q) => q.status === 'queued' || q.status === 'error');

    for (let i = 0; i < itemsToProcess.length; i++) {
      const current = itemsToProcess[i];
      setActiveItemIndex(i);

      // Update state to scanning
      setQueue((prev) =>
        prev.map((q) =>
          q.id === current.id
            ? { ...q, status: 'scanning', progress: 35 }
            : q
        )
      );

      try {
        let res: Response;
        try {
          res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: current.rawText,
              title: current.title,
              fileName: current.file?.name,
              fileSizeFormatted: current.sizeFormatted,
              academicLevel,
            }),
          });
        } catch {
          // Network or initial call failure - switch to local engine
          res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: current.rawText,
              title: current.title,
              fileName: current.file?.name,
              fileSizeFormatted: current.sizeFormatted,
              academicLevel,
              engine: 'local',
            }),
          });
        }

        // Automatic seamless fallback to local engine if 429 quota or server hiccup
        if (!res.ok) {
          console.warn(`Primary scan response (${res.status}), engaging local academic intelligence engine...`);
          res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: current.rawText,
              title: current.title,
              fileName: current.file?.name,
              fileSizeFormatted: current.sizeFormatted,
              academicLevel,
              engine: 'local',
            }),
          });
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(typeof err.error === 'string' ? err.error : `Scan could not be processed (HTTP ${res.status})`);
        }

        const scanResult: ScanResult = await res.json();

        if (onSaveToHistory) {
          onSaveToHistory(scanResult);
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === current.id
              ? {
                  ...q,
                  status: 'completed',
                  progress: 100,
                  result: scanResult,
                }
              : q
          )
        );
      } catch (scanErr: any) {
        console.error(`Batch scan error for ${current.title}:`, scanErr);
        let msg = scanErr?.message || 'Scan failed';
        if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          msg = 'Gemini quota limit reached. Using local academic integrity engine.';
        }
        setQueue((prev) =>
          prev.map((q) =>
            q.id === current.id
              ? {
                  ...q,
                  status: 'error',
                  progress: 0,
                  errorMessage: msg,
                }
              : q
          )
        );
      }
    }

    setIsProcessingBatch(false);
    setActiveItemIndex(null);
  };

  const handleExportCSV = () => {
    const results = completedItems.map((c) => c.result!).filter(Boolean);
    if (results.length === 0) return;
    exportBatchSummaryCSV(results);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 px-1 sm:px-0">
      {/* Zero Limits Bulk Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Multi-Document Queue · Batch Citation Audit</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Simultaneous Bulk Document Upload
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Upload multiple student essays, dissertations, or conference batches simultaneously. Compatible with all standard file formats: <span className="text-slate-100 font-mono text-[11px] sm:text-xs">PDF, DOCX, DOC, RTF, ODT, TXT, MD, TEX, HTML, CSV, BIB</span> with zero size or page restrictions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full sm:w-auto">
              <label className="block text-[11px] text-slate-400 mb-1">Target Academic Standard</label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="undergraduate">Undergraduate Level</option>
                <option value="postgraduate">Postgraduate / Thesis</option>
                <option value="journal_publication">Journal / Peer Review</option>
                <option value="high_school">High School</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-teal-500 bg-teal-950/30'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.md,.markdown,.tex,.latex,.html,.htm,.csv,.bib"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-600/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Drag and drop your academic documents here, or <span className="text-teal-400 underline underline-offset-2">browse files</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select multiple files at once. All standard formats supported (.pdf, .docx, .doc, .txt, .odt, .tex, .rtf, .md, .html).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No Page Limits</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No File Size Caps</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simultaneous Batch Scans</span>
            </span>
          </div>
        </div>
      </div>

      {/* Batch Control Toolbar */}
      {queue.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              Queue Status: <span className="text-white font-mono">{queue.length}</span> documents
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-emerald-400">
              {completedItems.length} scanned
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              {pendingItems.length} ready
            </span>
          </div>

          <div className="flex items-center gap-2">
            {completedItems.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Export batch comparison summary as CSV"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export Batch CSV</span>
              </button>
            )}

            <button
              onClick={handleClearAll}
              disabled={isProcessingBatch}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>

            <button
              onClick={handleStartBatchScan}
              disabled={isProcessingBatch || pendingItems.length === 0}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-lg transition-all shadow-md ${
                isProcessingBatch || pendingItems.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
              }`}
            >
              {isProcessingBatch ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing Batch ({activeItemIndex !== null ? `${activeItemIndex + 1}/${pendingItems.length}` : '...'})</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Scan All In Queue ({pendingItems.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Queue Document List */}
      {queue.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800/80">
            {queue.map((item, idx) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-300">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate max-w-md" title={item.title}>
                        {item.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.sizeFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {item.wordCount > 0 ? (
                        <span>
                          <strong className="text-slate-300 font-mono">{item.wordCount.toLocaleString()}</strong> words (~{Math.ceil(item.wordCount / 275)} pages)
                        </span>
                      ) : (
                        <span>Reading text stream...</span>
                      )}
                      <span>·</span>
                      <span>Added {item.addedAt}</span>
                    </div>

                    {item.errorMessage && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>{item.errorMessage}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  {item.status === 'completed' && item.result && (
                    <div className="flex items-center gap-3">
                      {/* Similarity Badge */}
                      <div className="text-right">
                        <div className="text-xs font-semibold">
                          <span
                            className={
                              item.result.overallSimilarityPercent > 20
                                ? 'text-rose-400'
                                : item.result.overallSimilarityPercent > 10
                                ? 'text-amber-400'
                                : 'text-teal-400'
                            }
                          >
                            {item.result.overallSimilarityPercent}% Similarity
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.result.citations.length} Citations Audited
                        </div>
                      </div>

                      <button
                        onClick={() => onViewReport(item.result!)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Report</span>
                      </button>
                    </div>
                  )}

                  {item.status === 'scanning' && (
                    <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
                      <span>Auditing content...</span>
                    </div>
                  )}

                  {item.status === 'extracting' && (
                    <div className="flex items-center gap-2 text-xs text-sky-400">
                      <div className="w-3.5 h-3.5 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
                      <span>Extracting text...</span>
                    </div>
                  )}

                  {item.status === 'queued' && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Queued</span>
                    </span>
                  )}

                  {!isProcessingBatch && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Completed Summary Matrix */}
      {completedItems.length > 1 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              <span>Batch Plagiarism & Citation Comparison Matrix</span>
            </h3>
            <button
              onClick={handleExportCSV}
              className="text-xs px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3 h-3 text-sky-400" />
              <span>Download CSV Matrix</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-semibold">
                  <th className="py-2.5 px-3">Document Title</th>
                  <th className="py-2.5 px-3 font-mono">Words</th>
                  <th className="py-2.5 px-3">Similarity</th>
                  <th className="py-2.5 px-3">AI Writing</th>
                  <th className="py-2.5 px-3">Human Original</th>
                  <th className="py-2.5 px-3">Journals %</th>
                  <th className="py-2.5 px-3">Internet %</th>
                  <th className="py-2.5 px-3">Student Repo %</th>
                  <th className="py-2.5 px-3">Attribution Score</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {completedItems.map((c) => {
                  const r = c.result!;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-white max-w-xs truncate" title={r.documentTitle}>
                        {r.documentTitle}
                      </td>
                      <td className="py-3 px-3 font-mono">{r.wordCount.toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold">
                        <span
                          className={
                            r.overallSimilarityPercent > 20
                              ? 'text-rose-400'
                              : r.overallSimilarityPercent > 10
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {r.overallSimilarityPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={
                            r.aiWritingScorePercent > 40
                              ? 'text-rose-400'
                              : r.aiWritingScorePercent > 20
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }
                        >
                          {r.aiWritingScorePercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sky-400 font-semibold">{r.originalityScorePercent}%</td>
                      <td className="py-3 px-3">{r.sourcesBreakdown.academicJournalsPercent}%</td>
                      <td className="py-3 px-3">{r.sourcesBreakdown.internetSourcesPercent}%</td>
                      <td className="py-3 px-3">{r.sourcesBreakdown.studentRepositoryPercent}%</td>
                      <td className="py-3 px-3 font-mono text-purple-300">
                        {r.citationAudit.styleConsistencyScore}%
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-300">
                          {r.integrityVerdict}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onViewReport(r)}
                          className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-2"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
