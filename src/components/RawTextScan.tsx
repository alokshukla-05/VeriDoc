import React, { useState, useRef } from 'react';
import {
  FileText,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Trash2,
  Copy,
  Check,
  ClipboardPaste,
  AlertCircle,
  GraduationCap,
  Info,
  BookOpen,
  ArrowRight,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { AcademicLevel, ScanOptions, ScanResult } from '../types';
import { parseFileToText } from '../utils/fileParser';

interface RawTextScanProps {
  onScanComplete: (result: ScanResult) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

export const RawTextScan: React.FC<RawTextScanProps> = ({
  onScanComplete,
  isScanning,
  setIsScanning,
}) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('undergraduate');
  const [options, setOptions] = useState<ScanOptions>({
    excludeQuotes: false,
    excludeBibliography: false,
    excludeSmallMatches: true,
    academicLevel: 'undergraduate',
    sensitivityLevel: 'standard',
  });
  const [showOptions, setShowOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live text metrics
  const words = text.trim() ? text.trim().split(/\s+/).filter((w) => w.length > 0) : [];
  const wordCount = words.length;
  const charCount = text.length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 275));
  const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 220));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleProcessFile = async (file: File) => {
    setIsExtractingFile(true);
    setErrorMessage(null);
    try {
      const parsed = await parseFileToText(file);
      if (parsed.text && parsed.text.trim().length > 0) {
        setText(parsed.text.trim());
        if (!title.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
        showToast(`Successfully extracted ${parsed.wordCount} words from ${file.name}`);
      } else {
        setErrorMessage(`Could not extract readable text from "${file.name}". Please ensure the file contains text.`);
      }
    } catch (err: any) {
      setErrorMessage(`Error parsing ${file.name}: ${err.message || 'File read error'}`);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleCopyText = async () => {
    if (!text.trim()) {
      showToast('Text area is empty');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuccess(true);
      showToast('Copied all text to clipboard');
      setTimeout(() => setCopiedSuccess(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedSuccess(true);
      showToast('Copied all text to clipboard');
      setTimeout(() => setCopiedSuccess(false), 2000);
    }
  };

  const handleClearAll = () => {
    if (!text && !title) return;
    setText('');
    setTitle('');
    setErrorMessage(null);
    showToast('Text and title cleared');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText((prev) => (prev ? prev + '\n\n' + clipText : clipText));
        showToast('Pasted from clipboard');
      }
    } catch {
      showToast('Please press Ctrl+V / Cmd+V to paste');
    }
  };

  const handleStartScan = async () => {
    if (!text.trim() || wordCount < 10) {
      setErrorMessage('Please provide at least 10 words of academic text to perform an integrity scan.');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);

    try {
      let response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          title: title.trim() || 'Untitled Academic Submission',
          academicLevel,
          options,
        }),
      });

      // Seamless fallback to high-precision local engine if quota or network issue
      if (!response.ok) {
        console.warn(`Primary scan response (${response.status}), engaging local academic engine...`);
        response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            title: title.trim() || 'Untitled Academic Submission',
            academicLevel,
            options,
            engine: 'local',
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Scan failed with status ${response.status}`);
      }

      const result: ScanResult = await response.json();
      onScanComplete(result);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Unable to complete scan. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 px-1 sm:px-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500/40 text-slate-100 text-xs py-2 px-3.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Introduction Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>Turnitin-Grade Academic Integrity & Feedback Suite</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Direct Document & Essay Originality Auditor
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Submit your paper for rigorous real-time verification: <strong>Similarity & Shingle Matching</strong> against scholarly literature, <strong>AI-Writing Detection</strong> (sentence-by-sentence confidence), <strong>Citation & Bibliography Cross-Audit</strong>, and <strong>Draft Coach self-review</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Document Title & Academic Level */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Document Title / Paper Name (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Comparative Analysis of Quantum Cryptographic Protocols"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Academic Submission Level
            </label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
            >
              <option value="undergraduate">Undergraduate Essay</option>
              <option value="postgraduate">Postgraduate / Master&apos;s Thesis</option>
              <option value="journal_publication">Journal / Peer Review</option>
              <option value="high_school">High School Term Paper</option>
            </select>
          </div>
        </div>

        {/* Text Area Toolbar with Clear All & Copy */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileText className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-200">Essay & Paper Text Area</span>
          </div>

          {/* Action buttons: Upload File, Paste, Copy Text, Clear All */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.md,.markdown,.tex,.html,.htm"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtractingFile}
              className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900/90 text-teal-300 border border-teal-800/80 transition-colors font-medium"
              title="Upload PDF, Word DOCX, or text file"
            >
              {isExtractingFile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
                  <span>Upload File (PDF / DOCX)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
              title="Paste text from clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-teal-400" />
              <span>Paste</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              disabled={!text.trim()}
              className={`flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors border ${
                copiedSuccess
                  ? 'bg-teal-950/80 text-teal-300 border-teal-800'
                  : text.trim()
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Copy all text to clipboard"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  <span className="font-medium text-teal-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={!text && !title}
              className={`flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors border ${
                text || title
                  ? 'bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border-slate-700/80 hover:border-rose-800/60'
                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Clear all text and title"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Text Area with Drag & Drop */}
        <div
          className={`relative rounded-xl transition-all ${
            isDraggingOver ? 'ring-2 ring-teal-500 bg-teal-950/20' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
        >
          {isExtractingFile && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2 z-10 text-teal-300">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <span className="text-xs font-semibold">Extracting high-accuracy text from document...</span>
            </div>
          )}
          {isDraggingOver && (
            <div className="absolute inset-0 bg-teal-950/90 border-2 border-dashed border-teal-500 rounded-xl flex flex-col items-center justify-center gap-2 z-10 text-teal-200 pointer-events-none">
              <UploadCloud className="w-10 h-10 text-teal-400 animate-bounce" />
              <span className="text-sm font-bold">Drop PDF or Document Here</span>
              <span className="text-xs text-teal-300/80">Supports .pdf, .docx, .txt, .odt</span>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your raw academic paper or student essay text here, or drag & drop / upload a PDF file...

Include your in-text citations (e.g., (Smith, 2021) or [1]) and references at the end to evaluate citation consistency and detect orphan/phantom attributions."
            rows={14}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors font-serif-reading leading-relaxed resize-y min-h-[220px]"
          />
        </div>

        {/* Live Metrics Bar & Clear/Copy Quick Access */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
          {/* Word / Char / Page counts */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1 text-slate-300">
              <strong className="text-white font-mono">{wordCount.toLocaleString()}</strong> words
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <strong className="text-white font-mono">{charCount.toLocaleString()}</strong> characters
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <strong className="text-white font-mono">~{estimatedPages}</strong> pages
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>~{estimatedReadingTime} min read</span>
            </span>
          </div>

          {/* Audit options toggle */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
              <span>{showOptions ? 'Hide Scan Parameters' : 'Audit Parameters'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Parameters */}
        {showOptions && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
              <span>Plagiarism & Citation Filter Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={options.excludeQuotes}
                  onChange={(e) => setOptions({ ...options, excludeQuotes: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-teal-600 focus:ring-0"
                />
                <span>Exclude Properly Cited Direct Quotes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={options.excludeBibliography}
                  onChange={(e) => setOptions({ ...options, excludeBibliography: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-teal-600 focus:ring-0"
                />
                <span>Exclude Bibliography from Match %</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={options.excludeSmallMatches}
                  onChange={(e) => setOptions({ ...options, excludeSmallMatches: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-teal-600 focus:ring-0"
                />
                <span>Filter Small Common Phrases (&lt;10 words)</span>
              </label>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span>Audits against indexed scholarly literature, open web repositories, and student archives.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleStartScan}
              disabled={isScanning || wordCount === 0}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                isScanning || wordCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/25 active:scale-[0.98]'
              }`}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Auditing Originality & Citations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-200" />
                  <span>Run Plagiarism & Citation Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
