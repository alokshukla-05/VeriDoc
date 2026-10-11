import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Download,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Quote,
  Bot,
  BrainCircuit,
  GraduationCap,
  MessageSquare,
  Award,
  HelpCircle,
  Eye,
  EyeOff,
  Wand2,
  Tag,
  Plus,
  Trash2,
  Search,
  BarChart3,
  CheckSquare,
  Compass,
  X,
  FileDown,
} from 'lucide-react';
import {
  ScanResult,
  MatchedSegment,
  CitationItem,
  MatchSeverity,
  AISegment,
  GrammarFeedbackItem,
  InstructorComment,
  RubricCriterion,
  DetailedSentenceAudit,
} from '../types';
import {
  printAcademicReport,
  downloadPrintableHtml,
  exportAcademicTextSummary,
  exportBibTeX,
  exportFormattedCitationsText,
  exportFullJsonReport,
} from '../utils/citationExporter';

interface ScanReportViewProps {
  result: ScanResult;
  onBackToNewScan?: () => void;
}

export const ScanReportView: React.FC<ScanReportViewProps> = ({
  result,
  onBackToNewScan,
}) => {
  // 5 Core navigation tabs
  const [activeTab, setActiveTab] = useState<
    'similarity' | 'ai_writing' | 'citations_grammar' | 'draft_coach' | 'instructor_feedback'
  >('similarity');

  // Exclusion settings for dynamic score recalculation
  const [excludeBibliography, setExcludeBibliography] = useState(false);
  const [excludeQuotes, setExcludeQuotes] = useState(false);
  const [excludedSourceIds, setExcludedSourceIds] = useState<Set<string>>(new Set());

  // Similarity inspection state
  const [selectedSegment, setSelectedSegment] = useState<MatchedSegment | null>(
    result.matchedSegments[0] || null
  );
  const [severityFilter, setSeverityFilter] = useState<'all' | MatchSeverity>('all');
  const [citationFormatStyle, setCitationFormatStyle] = useState<
    'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'bibtex'
  >('apa');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<'paper' | 'inspector'>('paper');

  // Detail & Matrix sub-mode in similarity
  const [similaritySubView, setSimilaritySubView] = useState<'reader' | 'matrix'>('reader');
  const [canvasMode, setCanvasMode] = useState<'turnitin_paper' | 'side_by_side' | 'match_cards'>('turnitin_paper');
  const [sentenceSearch, setSentenceSearch] = useState('');
  const [sentenceFilter, setSentenceFilter] = useState<'all' | 'flagged' | 'original' | 'ai'>('all');

  // AI-writing state
  const [selectedAISegment, setSelectedAISegment] = useState<AISegment | null>(
    result.aiSegments[0] || null
  );
  const [aiFilter, setAiFilter] = useState<'all' | 'ai_generated' | 'ai_paraphrased'>('all');

  // Draft Coach companion view state
  const [companionPlatform, setCompanionPlatform] = useState<'google_docs' | 'word_online'>('google_docs');
  const [activeChecklistCategory, setActiveChecklistCategory] = useState<'all' | 'similarity' | 'citations' | 'grammar'>('all');

  // Print & Export modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printActionFeedback, setPrintActionFeedback] = useState<string | null>(null);

  // Instructor feedback state
  const [comments, setComments] = useState<InstructorComment[]>(
    (result.instructorComments || []).map((comm, idx) => ({
      ...comm,
      id: comm.id || `comm-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }))
  );
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedQuickMark, setSelectedQuickMark] = useState('Cite Source');
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>(
    (result.rubric?.criteria || []).map((crit, idx) => ({
      ...crit,
      id: crit.id || `crit-${idx}-${crit.name?.replace(/\s+/g, '_') || idx}`,
    }))
  );

  // QuickMark presets
  const quickMarks = [
    { label: 'Cite Source', desc: 'Missing citation for empirical claim' },
    { label: 'Strong Argument', desc: 'Commendable thesis formulation' },
    { label: 'Awkward Phrasing', desc: 'Revise for academic clarity' },
    { label: 'Weak Evidence', desc: 'Needs secondary literature support' },
    { label: 'Unclear Thesis', desc: 'Clarify main proposition' },
  ];

  // Dynamic recalculation of similarity when sources or quotes are excluded
  const activeSegments = result.matchedSegments.filter((seg) => {
    if (excludedSourceIds.has(seg.id)) return false;
    if (excludeQuotes && seg.severity === 'proper_quote') return false;
    if (severityFilter !== 'all' && seg.severity !== severityFilter) return false;
    return true;
  });

  const rawActiveCount = result.matchedSegments.filter((seg) => {
    if (excludedSourceIds.has(seg.id)) return false;
    if (excludeQuotes && seg.severity === 'proper_quote') return false;
    return true;
  }).length;

  const adjustedSimilarity = Math.max(
    0,
    Math.round(
      (rawActiveCount / Math.max(1, result.matchedSegments.length)) *
        result.overallSimilarityPercent *
        (excludeBibliography ? 0.85 : 1)
    )
  );
  const adjustedOriginality = Math.max(0, 100 - Math.max(adjustedSimilarity, result.aiWritingScorePercent || 0));

  const handleToggleExcludeSource = (id: string) => {
    setExcludedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyText = (textToCopy: string, id: string) => {
    try {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: InstructorComment = {
      id: `comm-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      startIndex: 0,
      endIndex: 50,
      selectedText: selectedSegment ? selectedSegment.matchedText.slice(0, 50) : 'General Document Feedback',
      author: 'Prof. Academic Reviewer',
      timestamp: 'Just now',
      commentText: newCommentText.trim(),
      type: 'quickmark',
      quickmarkTag: selectedQuickMark,
    };
    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  const handleDeleteComment = (id: string) => {
    setComments(comments.filter((c) => c.id !== id));
  };

  const handleRubricScoreChange = (id: string, newScore: number) => {
    setRubricCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, score: Math.min(5, Math.max(1, newScore)) } : c))
    );
  };

  // Compute calculated rubric score
  const totalRubricScore = Math.round(
    rubricCriteria.reduce((acc, c) => acc + (c.score / 5) * c.weight, 0)
  );

  const getRubricGrade = (score: number) => {
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 75) return 'C+';
    return 'C';
  };

  // Filter sentences for the detailed sentence matrix
  const detailedSentencesList: DetailedSentenceAudit[] = result.detailedSentences || [];
  const filteredSentences = detailedSentencesList.filter((s) => {
    if (sentenceSearch && !s.text.toLowerCase().includes(sentenceSearch.toLowerCase())) {
      return false;
    }
    if (sentenceFilter === 'flagged') return s.status !== 'original';
    if (sentenceFilter === 'original') return s.status === 'original';
    if (sentenceFilter === 'ai') return s.status === 'ai_generated';
    return true;
  });

  // Turnitin Source Color Palette and Index Mapping
  const uniqueSources = Array.from(new Set(activeSegments.map((s) => s.sourceTitle)));
  const getSourceIndex = (title: string) => {
    const idx = uniqueSources.indexOf(title);
    return idx >= 0 ? idx + 1 : 1;
  };
  const getSourceNumber = getSourceIndex;

  const SOURCE_PALETTE = [
    { bg: 'bg-rose-500/20 text-rose-100 border-rose-500/80', badge: 'bg-rose-600 text-white', activeRing: 'ring-2 ring-rose-400', hover: 'hover:bg-rose-500/30' },
    { bg: 'bg-sky-500/20 text-sky-100 border-sky-500/80', badge: 'bg-sky-600 text-white', activeRing: 'ring-2 ring-sky-400', hover: 'hover:bg-sky-500/30' },
    { bg: 'bg-amber-500/20 text-amber-100 border-amber-500/80', badge: 'bg-amber-600 text-white', activeRing: 'ring-2 ring-amber-400', hover: 'hover:bg-amber-500/30' },
    { bg: 'bg-emerald-500/20 text-emerald-100 border-emerald-500/80', badge: 'bg-emerald-600 text-white', activeRing: 'ring-2 ring-emerald-400', hover: 'hover:bg-emerald-500/30' },
    { bg: 'bg-purple-500/20 text-purple-100 border-purple-500/80', badge: 'bg-purple-600 text-white', activeRing: 'ring-2 ring-purple-400', hover: 'hover:bg-purple-500/30' },
    { bg: 'bg-cyan-500/20 text-cyan-100 border-cyan-500/80', badge: 'bg-cyan-600 text-white', activeRing: 'ring-2 ring-cyan-400', hover: 'hover:bg-cyan-500/30' },
  ];

  const getSourcePalette = (sourceNum: number) => {
    return SOURCE_PALETTE[(sourceNum - 1) % SOURCE_PALETTE.length];
  };

  // Render authentic Turnitin Paper Canvas
  const renderHighlightedCanvas = () => {
    const fullText = result.scannedText || '';
    if (!fullText) return null;

    // AI Writing Layer
    if (activeTab === 'ai_writing') {
      const aiItems = result.aiSegments || [];
      const paragraphs = fullText.split(/\n\s*\n/).filter(Boolean);

      return (
        <div className="p-4 sm:p-6 text-xs sm:text-sm text-slate-200 font-serif-reading leading-relaxed select-text space-y-4">
          <div className="p-3 bg-slate-950/90 rounded-xl border border-cyan-900/40 text-xs text-cyan-200 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>Turnitin AI Detection Layer: Cyan = AI-Generated · Violet = AI-Paraphrased</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{aiItems.length} Flagged AI Sentences</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-inner space-y-4 text-slate-300">
            {paragraphs.map((para, pIdx) => {
              // Find matching AI segments inside this paragraph
              const matchedInPara = aiItems.filter((seg) => seg.text && para.includes(seg.text));

              if (matchedInPara.length === 0) {
                return (
                  <p key={`ai-p-${pIdx}`} className="leading-loose">
                    {para}
                  </p>
                );
              }

              // Segment paragraph text
              let remaining = para;
              const segmentsToRender: React.ReactNode[] = [];

              while (remaining.length > 0) {
                let earliestMatch: AISegment | null = null;
                let earliestIndex = Infinity;

                for (const seg of matchedInPara) {
                  const idx = remaining.indexOf(seg.text);
                  if (idx !== -1 && idx < earliestIndex) {
                    earliestIndex = idx;
                    earliestMatch = seg;
                  }
                }

                if (!earliestMatch || earliestIndex === Infinity) {
                  segmentsToRender.push(<span key={`rem-${segmentsToRender.length}`}>{remaining}</span>);
                  break;
                }

                if (earliestIndex > 0) {
                  segmentsToRender.push(
                    <span key={`pre-${segmentsToRender.length}`}>{remaining.slice(0, earliestIndex)}</span>
                  );
                }

                const isSelected = selectedAISegment?.id === earliestMatch.id;
                segmentsToRender.push(
                  <mark
                    key={`mark-${earliestMatch.id}-${segmentsToRender.length}`}
                    onClick={() => setSelectedAISegment(earliestMatch)}
                    className={`cursor-pointer rounded px-1.5 py-0.5 mx-0.5 transition-all inline font-serif-reading border-b-2 ${
                      earliestMatch.classification === 'ai_generated'
                        ? isSelected
                          ? 'bg-cyan-500/40 text-cyan-100 ring-2 ring-cyan-400 border-cyan-400 font-medium'
                          : 'bg-cyan-500/20 text-cyan-200 border-cyan-500/60 hover:bg-cyan-500/30'
                        : isSelected
                        ? 'bg-purple-500/40 text-purple-100 ring-2 ring-purple-400 border-purple-400 font-medium'
                        : 'bg-purple-500/20 text-purple-200 border-purple-500/60 hover:bg-purple-500/30'
                    }`}
                    title={`${earliestMatch.classification.replace('_', ' ')}: ${earliestMatch.confidence}% confidence`}
                  >
                    {earliestMatch.text}
                    <sup className={`ml-1 px-1 py-0.2 rounded text-[10px] font-mono font-bold ${
                      earliestMatch.classification === 'ai_generated' ? 'bg-cyan-600 text-white' : 'bg-purple-600 text-white'
                    }`}>
                      AI {earliestMatch.confidence}%
                    </sup>
                  </mark>
                );

                remaining = remaining.slice(earliestIndex + earliestMatch.text.length);
              }

              return (
                <p key={`ai-p-${pIdx}`} className="leading-loose">
                  {segmentsToRender}
                </p>
              );
            })}
          </div>
        </div>
      );
    }

    // Similarity Layer (Turnitin Feedback Studio)
    const paragraphs = fullText.split(/\n\s*\n/).filter(Boolean);

    return (
      <div className="p-4 sm:p-6 text-xs sm:text-sm text-slate-300 font-serif-reading leading-relaxed select-text space-y-4">
        {/* Turnitin Canvas Control Header */}
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setCanvasMode('turnitin_paper')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                canvasMode === 'turnitin_paper'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Turnitin Paper View</span>
            </button>
            <button
              onClick={() => setCanvasMode('side_by_side')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                canvasMode === 'side_by_side'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Side-by-Side Review</span>
            </button>
            <button
              onClick={() => setCanvasMode('match_cards')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                canvasMode === 'match_cards'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Match List</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-teal-400 font-semibold">
              {activeSegments.length} Flagged Matches ({adjustedSimilarity}% Overall)
            </span>
          </div>
        </div>

        {/* Source Quick-Jump Legend */}
        {uniqueSources.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            <span className="text-[11px] text-slate-400 font-medium">Matching Sources:</span>
            {uniqueSources.slice(0, 6).map((srcTitle, sIdx) => {
              const srcNum = sIdx + 1;
              const palette = getSourcePalette(srcNum);
              const count = activeSegments.filter((s) => s.sourceTitle === srcTitle).length;
              return (
                <button
                  key={`src-pill-${sIdx}`}
                  onClick={() => {
                    const firstMatch = activeSegments.find((s) => s.sourceTitle === srcTitle);
                    if (firstMatch) {
                      setSelectedSegment(firstMatch);
                      setMobilePane('inspector');
                    }
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1.5 transition-all ${palette.bg} hover:ring-1 hover:ring-white`}
                  title={srcTitle}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${palette.badge}`}>
                    {srcNum}
                  </span>
                  <span className="truncate max-w-[140px] text-white">{srcTitle}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* MODE 1: Authentic Turnitin In-Line Paper Canvas */}
        {canvasMode === 'turnitin_paper' && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-inner space-y-4 text-slate-300">
            {activeSegments.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>100% Original Document: Zero plagiarism or uncredited source overlaps detected.</span>
              </div>
            ) : null}

            {paragraphs.map((para, pIdx) => {
              const matchedInPara = activeSegments.filter((seg) => seg.matchedText && para.includes(seg.matchedText));

              if (matchedInPara.length === 0) {
                return (
                  <p key={`para-${pIdx}`} className="leading-loose">
                    {para}
                  </p>
                );
              }

              let remaining = para;
              const segmentsToRender: React.ReactNode[] = [];

              while (remaining.length > 0) {
                let earliestMatch: MatchedSegment | null = null;
                let earliestIndex = Infinity;

                for (const seg of matchedInPara) {
                  const idx = remaining.indexOf(seg.matchedText);
                  if (idx !== -1 && idx < earliestIndex) {
                    earliestIndex = idx;
                    earliestMatch = seg;
                  }
                }

                if (!earliestMatch || earliestIndex === Infinity) {
                  segmentsToRender.push(<span key={`rem-${segmentsToRender.length}`}>{remaining}</span>);
                  break;
                }

                if (earliestIndex > 0) {
                  segmentsToRender.push(
                    <span key={`pre-${segmentsToRender.length}`}>{remaining.slice(0, earliestIndex)}</span>
                  );
                }

                const srcNum = getSourceNumber(earliestMatch.sourceTitle);
                const palette = getSourcePalette(srcNum);
                const isSelected = selectedSegment?.id === earliestMatch.id;

                segmentsToRender.push(
                  <mark
                    key={`mark-${earliestMatch.id}-${segmentsToRender.length}`}
                    onClick={() => {
                      setSelectedSegment(earliestMatch);
                      setMobilePane('inspector');
                    }}
                    className={`cursor-pointer rounded px-1.5 py-0.5 mx-0.5 transition-all inline font-serif-reading border-b-2 ${palette.bg} ${
                      isSelected ? `${palette.activeRing} ring-offset-1 font-medium shadow-md` : palette.hover
                    }`}
                    title={`Source #${srcNum}: ${earliestMatch.sourceTitle} (${earliestMatch.similarityScore}% match)`}
                  >
                    {earliestMatch.matchedText}
                    <sup className={`ml-1 px-1 py-0.2 rounded text-[10px] font-mono font-bold shadow-sm ${palette.badge}`}>
                      {srcNum}
                    </sup>
                  </mark>
                );

                remaining = remaining.slice(earliestIndex + earliestMatch.matchedText.length);
              }

              return (
                <p key={`para-${pIdx}`} className="leading-loose">
                  {segmentsToRender}
                </p>
              );
            })}
          </div>
        )}

        {/* MODE 2: Side-by-Side Review */}
        {canvasMode === 'side_by_side' && (
          <div className="space-y-4">
            {activeSegments.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-center text-xs">
                No overlapping sources found for side-by-side comparison.
              </div>
            ) : (
              activeSegments.map((seg, idx) => {
                const srcNum = getSourceNumber(seg.sourceTitle);
                const palette = getSourcePalette(srcNum);
                const isSelected = selectedSegment?.id === seg.id;

                return (
                  <div
                    key={`side-seg-${seg.id || idx}`}
                    onClick={() => {
                      setSelectedSegment(seg);
                      setMobilePane('inspector');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-teal-500 ring-1 ring-teal-500 shadow-xl'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${palette.badge}`}>
                          Match #{srcNum}
                        </span>
                        <span className="font-semibold text-white capitalize">{seg.severity.replace('_', ' ')}</span>
                        <span className="font-mono text-teal-400 font-bold">{seg.similarityScore}% Match</span>
                      </div>
                      <span className="text-slate-400 text-[11px] truncate max-w-xs">{seg.sourceTitle}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-slate-900/90 border border-rose-950/60 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                          Submitted Student Text
                        </span>
                        <p className="text-xs text-rose-200 font-serif-reading leading-relaxed">
                          "{seg.matchedText}"
                        </p>
                      </div>

                      <div className="p-3 bg-slate-900/90 border border-sky-950/60 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                          Original Academic / Web Source
                        </span>
                        <p className="text-xs text-sky-200 font-serif-reading leading-relaxed">
                          "{seg.sourceExcerpt}"
                        </p>
                        <div className="text-[10px] text-slate-400 pt-1">
                          Source: {seg.sourceAuthor} ({seg.sourceYear})
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MODE 3: Match Cards List */}
        {canvasMode === 'match_cards' && (
          <div className="space-y-3">
            {activeSegments.map((seg, idx) => {
              const srcNum = getSourceNumber(seg.sourceTitle);
              const palette = getSourcePalette(srcNum);
              const isSelected = selectedSegment?.id === seg.id;

              return (
                <div
                  key={`card-seg-${seg.id || idx}`}
                  onClick={() => {
                    setSelectedSegment(seg);
                    setMobilePane('inspector');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-teal-500 ring-1 ring-teal-500 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs pb-1.5 mb-1.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${palette.badge}`}>
                        #{srcNum}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                          seg.severity === 'exact'
                            ? 'bg-rose-500/20 text-rose-300'
                            : seg.severity === 'paraphrased'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {seg.severity.replace('_', ' ')} · {seg.similarityScore}%
                      </span>
                    </div>
                    <span className="text-slate-400 truncate max-w-xs text-[11px]">
                      Source: {seg.sourceTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-serif-reading">
                    "{seg.matchedText}"
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-1 sm:px-0">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200 uppercase tracking-wider">
                Comprehensive Academic Review
              </span>
              <span>·</span>
              <span className="truncate max-w-xs">{result.documentTitle}</span>
              <span>·</span>
              <span className="font-mono text-slate-500">ID: {result.id.slice(-8)}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight mt-1">
              Academic Integrity, AI-Writing & Instructional Feedback Studio
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 pt-1">
              <span>
                <strong className="text-slate-200 font-mono">{result.wordCount.toLocaleString()}</strong> words
              </span>
              <span>·</span>
              <span>
                <strong className="text-slate-200 font-mono">~{result.pageCountEstimate}</strong> pages
              </span>
              <span>·</span>
              <span>
                Standard: <span className="text-teal-400 capitalize">{result.academicLevel.replace('_', ' ')}</span>
              </span>
              <span>·</span>
              <span>{new Date(result.scanTimestamp).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Export & Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCopyText(result.scannedText, 'copy-full-paper')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
              title="Copy entire document text"
            >
              {copiedId === 'copy-full-paper' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              title="Open print options, trigger browser print, or download printable report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Report</span>
            </button>

            <button
              onClick={() => exportBibTeX(result.citations)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>BibTeX</span>
            </button>

            <button
              onClick={() => exportFullJsonReport(result)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>JSON Audit</span>
            </button>
          </div>
        </div>

        {/* 5-Pillar Score Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-5">
          {/* Pillar 1: Similarity */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              1. Similarity Score
            </div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold mt-1 font-mono ${
                adjustedSimilarity > 20
                  ? 'text-rose-400'
                  : adjustedSimilarity > 10
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {adjustedSimilarity}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {adjustedOriginality}% Human Original
            </div>
          </div>

          {/* Pillar 2: AI Writing */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              2. AI-Writing Indicator
            </div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold mt-1 font-mono ${
                result.aiWritingScorePercent > 40
                  ? 'text-rose-400'
                  : result.aiWritingScorePercent > 20
                  ? 'text-amber-400'
                  : 'text-cyan-400'
              }`}
            >
              {result.aiWritingScorePercent}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {result.aiWritingScorePercent > 40
                ? 'High AI Authorship'
                : result.aiWritingScorePercent > 20
                ? 'Moderate AI Markers'
                : 'Verified Human Flow'}
            </div>
          </div>

          {/* Pillar 3: Citations & Grammar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              3. Citation Accuracy
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1 font-mono">
              {result.citationAudit.styleConsistencyScore}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {result.citationAudit.detectedPrimaryStyle}
            </div>
          </div>

          {/* Pillar 4: Draft Coach */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              4. Draft Coach Status
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
              {result.coachingChecklist.filter((c) => c.status === 'passed').length} /{' '}
              {result.coachingChecklist.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Draft {result.draftNumber || 1} of 3
            </div>
          </div>

          {/* Pillar 5: Instructor Grade */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              5. Rubric Grade
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 mt-1 font-mono">
              {getRubricGrade(totalRubricScore)} ({totalRubricScore}%)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {comments.length} Notes / Annotations
            </div>
          </div>
        </div>
      </div>

      {/* Primary 5-Pillar Tab Navigation */}
      <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('similarity')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'similarity'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. Similarity Checking ({activeSegments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_writing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'ai_writing'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
          <span>2. AI-Writing Detection ({result.aiWritingScorePercent}%)</span>
        </button>

        <button
          onClick={() => setActiveTab('citations_grammar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'citations_grammar'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>3. Citations & Grammar ({result.citations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('draft_coach')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'draft_coach'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          <span>4. Draft Coach</span>
        </button>

        <button
          onClick={() => setActiveTab('instructor_feedback')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'instructor_feedback'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>5. Instructor Grading Studio</span>
        </button>
      </div>

      {/* PILLAR 1: SIMILARITY CHECKING */}
      {activeTab === 'similarity' && (
        <div className="space-y-5">
          {/* Sub-view switcher: Document Reader vs 100% Detail Sentence Matrix */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimilaritySubView('reader')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  similaritySubView === 'reader'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Side-by-Side Document Reader</span>
              </button>
              <button
                onClick={() => setSimilaritySubView('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  similaritySubView === 'matrix'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Granular Sentence Matrix & Telemetry</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Full Diagnostic Verification</span>
            </div>
          </div>

          {similaritySubView === 'reader' && (
            <>
              {/* Exclusion & Filter Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-300">Live Exclusion Filters:</span>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={excludeBibliography}
                      onChange={(e) => setExcludeBibliography(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-teal-600"
                    />
                    <span>Exclude Bibliography</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={excludeQuotes}
                      onChange={(e) => setExcludeQuotes(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-teal-600"
                    />
                    <span>Exclude Quoted Material</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Recalculated Score:</span>
                  <span className="font-mono font-bold text-base text-teal-400">
                    {adjustedSimilarity}%
                  </span>
                  {excludedSourceIds.size > 0 && (
                    <button
                      onClick={() => setExcludedSourceIds(new Set())}
                      className="text-[11px] text-rose-400 hover:underline ml-2"
                    >
                      Reset ({excludedSourceIds.size} excluded)
                    </button>
                  )}
                </div>
              </div>

              {/* Main Side-by-Side Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Paper Highlight Canvas */}
                <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Submitted Document & Passage Overlays</span>
                    <span className="text-slate-500 text-[11px]">Click any passage to inspect source</span>
                  </div>
                  <div className="max-h-[700px] overflow-y-auto">{renderHighlightedCanvas()}</div>
                </div>

                {/* Source Inspector Panel with Exclusion Button */}
                <div className="lg:col-span-5 space-y-4">
                  {selectedSegment ? (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 sticky top-20">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              selectedSegment.severity === 'exact'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {selectedSegment.severity.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono font-bold text-white">
                            {selectedSegment.similarityScore}% Overlap
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleExcludeSource(selectedSegment.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                            excludedSourceIds.has(selectedSegment.id)
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                        >
                          {excludedSourceIds.has(selectedSegment.id) ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-400" />
                              <span>Include Source</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-400" />
                              <span>Exclude Source</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Excerpts */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                            Submitted Student Excerpt
                          </span>
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-rose-200 font-serif-reading leading-relaxed">
                            "{selectedSegment.matchedText}"
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                            Matched Scholarly / Internet Source
                          </span>
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-sky-200 font-serif-reading leading-relaxed">
                            "{selectedSegment.sourceExcerpt}"
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase block">Source Title</span>
                          <h4 className="font-semibold text-white leading-tight">
                            {selectedSegment.sourceTitle}
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase block">Author</span>
                            <span>{selectedSegment.sourceAuthor}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase block">Year</span>
                            <span className="font-mono">{selectedSegment.sourceYear}</span>
                          </div>
                        </div>

                        {selectedSegment.doi && (
                          <div className="pt-1">
                            <a
                              href={selectedSegment.sourceUrl || `https://doi.org/${selectedSegment.doi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 text-xs"
                            >
                              <span>DOI: {selectedSegment.doi}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Recommendation */}
                      <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-900/50 text-xs text-teal-200">
                        <span className="font-semibold text-teal-300 block mb-0.5">
                          Integrity Action Plan
                        </span>
                        <p>{selectedSegment.recommendation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                      Select any highlighted passage to inspect matching sources.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 100% DETAIL & SENTENCE-BY-SENTENCE AUDIT MATRIX */}
          {similaritySubView === 'matrix' && (
            <div className="space-y-6">
              {/* Linguistic & Readability Telemetry Cards */}
              {result.granularStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] uppercase text-slate-400 block">Total Sentences</span>
                    <span className="text-xl font-bold font-mono text-white mt-1 block">
                      {result.granularStats.totalSentences}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ~{result.granularStats.avgSentenceLengthWords} w/sentence
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] uppercase text-slate-400 block">Lexical Diversity (TTR)</span>
                    <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                      {result.granularStats.lexicalDiversityTTR}%
                    </span>
                    <span className="text-[10px] text-slate-500">Type-Token Ratio</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] uppercase text-slate-400 block">Reading Grade</span>
                    <span className="text-xl font-bold font-mono text-teal-400 mt-1 block">
                      {result.granularStats.fleschKincaidGradeLevel}
                    </span>
                    <span className="text-[10px] text-slate-500">Flesch-Kincaid Level</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] uppercase text-slate-400 block">Reading Ease</span>
                    <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                      {result.granularStats.fleschReadingEase} / 100
                    </span>
                    <span className="text-[10px] text-slate-500">Academic Complexity</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] uppercase text-slate-400 block">Matching Words</span>
                    <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                      {result.granularStats.matchingWordsCount}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {result.granularStats.nonMatchingWordsCount} unique words
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] uppercase text-slate-400 block">Accuracy Index</span>
                    <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                      {result.granularStats.accuracyConfidenceScore}%
                    </span>
                    <span className="text-[10px] text-slate-500">Deterministic Audit</span>
                  </div>
                </div>
              )}

              {/* Aggregated Sources Breakdown */}
              {result.sourceMatchesAggregated && result.sourceMatchesAggregated.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" />
                    <span>Aggregated Scholarly Sources Overlap Matrix ({result.sourceMatchesAggregated.length})</span>
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                          <th className="py-2.5 px-3">Source Title</th>
                          <th className="py-2.5 px-3">Author & Year</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-right">Words</th>
                          <th className="py-2.5 px-3 text-right">% of Document</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.sourceMatchesAggregated.map((src, srcIdx) => (
                          <tr
                            key={`src-agg-row-${src.sourceTitle}-${srcIdx}`}
                            className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-3 text-white font-medium max-w-sm truncate">
                              {src.sourceTitle}
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              {src.sourceAuthor} ({src.sourceYear})
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                                {src.sourceType}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-200">
                              {src.matchedWordCount} w
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-teal-400">
                              {src.percentageOfDoc}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sentence-by-Sentence Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span>Sentence-by-Sentence Full Audit ({filteredSentences.length} sentences)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      100% granular verification showing every individual sentence's originality status, overlap, and matched reference.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={sentenceSearch}
                        onChange={(e) => setSentenceSearch(e.target.value)}
                        placeholder="Search sentences..."
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <select
                      value={sentenceFilter}
                      onChange={(e) => setSentenceFilter(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">All Sentences</option>
                      <option value="flagged">Flagged Only</option>
                      <option value="original">Original Only</option>
                      <option value="ai">AI Classified</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                  {filteredSentences.map((sent, sentIdx) => (
                    <div
                      key={`sent-row-${sent.id || sentIdx}-${sent.sentenceIndex}`}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">
                            #{sent.sentenceIndex}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                              sent.status === 'original'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : sent.status === 'exact_match'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : sent.status === 'ai_generated'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {sent.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>{sent.wordCount} words</span>
                          {sent.similarityPercent > 0 && (
                            <span className="text-rose-400">{sent.similarityPercent}% overlap</span>
                          )}
                          {sent.aiProbabilityPercent > 10 && (
                            <span className="text-cyan-400">{sent.aiProbabilityPercent}% AI prob</span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 font-serif-reading leading-relaxed">
                        "{sent.text}"
                      </p>

                      {sent.matchedSourceTitle && (
                        <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>
                            Matched: <strong className="text-slate-300">{sent.matchedSourceTitle}</strong>
                          </span>
                          {sent.matchedSourceDoi && (
                            <span className="font-mono text-teal-400">DOI: {sent.matchedSourceDoi}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PILLAR 2: AI-WRITING DETECTION */}
      {activeTab === 'ai_writing' && (
        <div className="space-y-6">
          {/* AI Indicators Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                  <BrainCircuit className="w-4 h-4" />
                  <span>AI-Writing Detection Model</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Syntactic & Perplexity Distribution Analysis
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Confidence:</span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold font-mono">
                  {result.aiConfidence}
                </span>
              </div>
            </div>

            {/* Tri-Part Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-xs text-slate-400 block">AI-Generated (Synthetic)</span>
                <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
                  {result.aiGeneratedPercent}%
                </span>
                <span className="text-[11px] text-slate-500">Uniform syntax & low burstiness</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-xs text-slate-400 block">AI-Paraphrased (AI-Spun)</span>
                <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
                  {result.aiParaphrasedPercent}%
                </span>
                <span className="text-[11px] text-slate-500">Mixed human/AI vocabulary</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-xs text-slate-400 block">Human-Authored Content</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  {result.humanWrittenPercent}%
                </span>
                <span className="text-[11px] text-slate-500">Natural burstiness & rhythm</span>
              </div>
            </div>

            {/* Instructor Advisory Notice */}
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 leading-relaxed">
              <strong className="text-cyan-300 block mb-1">
                Instructor-Facing Review Guidance:
              </strong>
              AI detection percentages reflect probabilistic syntactic patterns and should not be used as sole proof of academic misconduct. Conduct a diagnostic interview or examine revision history drafts before drawing conclusions.
            </div>
          </div>

          {/* AI Flagged Passages List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Identified AI-Flagged Segments ({result.aiSegments.length})</span>
            </h4>

            <div className="space-y-3">
              {result.aiSegments.map((seg, idx) => (
                <div
                  key={`ai-seg-card-${seg.id || idx}-${idx}`}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                        seg.classification === 'ai_generated'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      {seg.classification.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 font-mono">{seg.confidence}% confidence</span>
                  </div>

                  <p className="text-xs text-slate-200 font-serif-reading leading-relaxed italic">
                    "{seg.text}"
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Model Indicators:</span>
                    {seg.modelClues.map((clue, i) => (
                      <span
                        key={`ai-clue-${seg.id || idx}-${i}-${clue.slice(0, 8)}`}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                      >
                        {clue}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 3: CITATION & REFERENCING CHECKS + GRAMMAR */}
      {activeTab === 'citations_grammar' && (
        <div className="space-y-6">
          {/* Citation Cross-Audit Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block">In-Text Citations</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">
                {result.citationAudit.totalInTextCitations}
              </span>
              <span className="text-[11px] text-slate-500">Found in body</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block">Bibliography Entries</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">
                {result.citationAudit.totalBibliographyEntries}
              </span>
              <span className="text-[11px] text-slate-500">In Works Cited</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block">Orphan Citations</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {result.citationAudit.orphanInTextCount}
              </span>
              <span className="text-[11px] text-slate-500">Unlinked in bibliography</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block">Grammar & Tone Score</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                {result.grammarScore}%
              </span>
              <span className="text-[11px] text-slate-500">Academic precision</span>
            </div>
          </div>

          {/* Interactive Citation Correspondence Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Interactive Citations & Reference Attribution Table ({result.citations.length})</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verification of citation correspondence, format style conformity, and 1-click citation export.
                </p>
              </div>

              {/* Style format toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">View Format:</span>
                <select
                  value={citationFormatStyle}
                  onChange={(e) => setCitationFormatStyle(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-teal-300 font-mono focus:outline-none focus:border-teal-500"
                >
                  <option value="apa">APA 7th</option>
                  <option value="mla">MLA 9th</option>
                  <option value="chicago">Chicago</option>
                  <option value="harvard">Harvard</option>
                  <option value="ieee">IEEE</option>
                  <option value="bibtex">BibTeX</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {result.citations.map((c, cIdx) => {
                const formattedText =
                  c.styleConformity?.[citationFormatStyle] ||
                  `${c.authors.join(', ')} (${c.year}). ${c.title}.`;
                return (
                  <div
                    key={`cit-card-${c.id || cIdx}-${cIdx}`}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {c.authors.join(', ')} ({c.year})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            c.inTextFound && c.bibliographyFound
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {c.inTextFound && c.bibliographyFound ? 'Verified Reference' : 'Attribution Warning'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyText(formattedText, `copy-cit-${c.id || cIdx}`)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 transition-colors"
                      >
                        {copiedId === `copy-cit-${c.id || cIdx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-teal-400" />
                            <span>Copy {citationFormatStyle.toUpperCase()}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-lg text-xs font-serif-reading text-slate-300">
                      {formattedText}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span>In-Text Body: {c.inTextFound ? '✓ Detected' : '✗ Not Found in text'}</span>
                      <span>Bibliography: {c.bibliographyFound ? '✓ Present in References' : '✗ Missing from references'}</span>
                      {c.notes && <span className="text-teal-400 italic">{c.notes}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grammar & Academic Tone Feedback Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span>Grammar, Tone & Style Coaching ({result.grammarIssues.length})</span>
            </h4>

            <div className="space-y-3">
              {result.grammarIssues.map((gram, idx) => (
                <div
                  key={`gram-issue-card-${gram.id || idx}-${idx}`}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-300 uppercase tracking-wider text-[10px]">
                      {gram.ruleTitle}
                    </span>
                    <span className="capitalize text-slate-400 text-[11px]">
                      {gram.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-200">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">
                        Original:
                      </span>
                      "{gram.originalText}"
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                        Suggested Improvement:
                      </span>
                      "{gram.suggestedText}"
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-1 leading-relaxed">{gram.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 4: DRAFT COACH (STUDENT SELF-REVIEW & WORD/DOCS INTEGRATION) */}
      {activeTab === 'draft_coach' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/60 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  <span>Draft Coach™ Guided Self-Review Studio</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Iterative Draft Analysis & Live Companion Add-In
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Draft Coach lets students run similarity, citation cross-checks, and grammar coaching without submitting to permanent institutional databases.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center flex-shrink-0">
                <span className="text-[11px] text-slate-400 block">Student Practice Scans</span>
                <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                  {result.draftAttemptsRemaining} of 3 Available
                </span>
              </div>
            </div>

            {/* Platform Add-in Switcher */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Cloud Integration Mode:</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCompanionPlatform('google_docs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      companionPlatform === 'google_docs'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Google Docs™ Companion
                  </button>
                  <button
                    onClick={() => setCompanionPlatform('word_online')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      companionPlatform === 'word_online'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Microsoft Word Online™ Add-In
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {companionPlatform === 'google_docs' ? (
                  <span>
                    ✓ Configured for Google Docs environment. All flagged passages, citation cross-references, and grammar feedback are formatted for standard Google Docs comments and sidebars.
                  </span>
                ) : (
                  <span>
                    ✓ Configured for Microsoft Word Online. Ready for sidebar synchronization with Office 365 academic document editors.
                  </span>
                )}
              </div>
            </div>

            {/* Actionable Checklist */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Revision Action Steps:
              </div>

              {result.coachingChecklist.map((item, idx) => (
                <div
                  key={`coach-item-row-${item.id || idx}-${idx}`}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3.5 hover:border-slate-700 transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.status === 'passed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {item.status === 'passed' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                          item.status === 'passed'
                            ? 'bg-emerald-950/80 text-emerald-300'
                            : 'bg-amber-950/80 text-amber-300'
                        }`}
                      >
                        {item.status === 'passed' ? 'Meets Standards' : 'Action Recommended'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
                    <div className="p-2 bg-slate-900 rounded-lg text-xs text-emerald-300 flex items-center gap-2 mt-1">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>
                        <strong>Next Action:</strong> {item.actionStep}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 5: INSTRUCTOR FEEDBACK & RUBRIC GRADING */}
      {activeTab === 'instructor_feedback' && (
        <div className="space-y-6">
          {/* Rubric Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Institutional Grading Rubric (Score: {totalRubricScore}%)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust scores (1 to 5) per criterion to automatically update the calculated grade and assessment report.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Assigned Grade:</span>
                <span className="text-xl font-bold font-mono px-3 py-1 rounded-xl bg-teal-600 text-white shadow-md">
                  {getRubricGrade(totalRubricScore)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {rubricCriteria.map((crit, critIdx) => (
                <div
                  key={`rubric-crit-row-${crit.id || critIdx}-${critIdx}`}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{crit.name}</h4>
                      <span className="text-[10px] text-slate-400">({crit.weight}% weight)</span>
                    </div>
                    <p className="text-xs text-slate-400">{crit.feedback}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={`rubric-score-btn-${crit.id || critIdx}-${val}`}
                        onClick={() => handleRubricScoreChange(crit.id, val)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all ${
                          crit.score === val
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QuickMarks & Inline Comments Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Instructor QuickMarks & Inline Annotations ({comments.length})</span>
            </h4>

            {/* Add Comment Toolbar */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Select QuickMark:</span>
                {quickMarks.map((qm, qmIdx) => (
                  <button
                    key={`quickmark-btn-${qmIdx}-${qm.label}`}
                    onClick={() => setSelectedQuickMark(qm.label)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      selectedQuickMark === qm.label
                        ? 'bg-teal-600 text-white border-teal-500'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {qm.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type an instructor note or customized feedback..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comm, commIdx) => (
                <div
                  key={`comm-card-item-${comm.id || commIdx}-${commIdx}`}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-bold uppercase font-mono">
                        {comm.quickmarkTag}
                      </span>
                      <span className="text-xs font-semibold text-white">{comm.author}</span>
                      <span className="text-[11px] text-slate-500">{comm.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{comm.commentText}</p>
                    <div className="text-[11px] text-slate-500 italic">
                      Attached to: "{comm.selectedText}"
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteComment(comm.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print & Official Academic Export Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-700/60 flex items-center justify-center text-teal-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Print & Official Academic Export</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                      ID: {result.id.slice(0, 14)}...
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate an official audit document, send to printer/PDF, or export data formats.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintActionFeedback(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Banner if action performed */}
            {printActionFeedback && (
              <div className="px-5 py-2.5 bg-emerald-950/70 border-b border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{printActionFeedback}</span>
                </div>
                <button
                  onClick={() => setPrintActionFeedback(null)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs font-mono"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Modal Body with Options & Paper Preview */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Quick Action Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Direct Browser Print */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 rounded-xl transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Printer className="w-4 h-4 text-teal-400" />
                      <span>Browser Print Dialog</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Sends the current page directly to your system print dialog (Ctrl+P / Cmd+P) to print or Save as PDF.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      try {
                        window.print();
                        setPrintActionFeedback('Browser print dialog initiated');
                      } catch {
                        downloadPrintableHtml(result);
                        setPrintActionFeedback('Print dialog blocked by browser iframe; downloaded Standalone HTML Report instead!');
                      }
                    }}
                    className="mt-4 w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Trigger Browser Print</span>
                  </button>
                </div>

                {/* 2. Standalone Printable HTML / PDF */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 rounded-xl transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <FileDown className="w-4 h-4 text-sky-400" />
                      <span>Standalone HTML / PDF</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Self-contained official report with academic seals, full score breakdowns, citations, and rubrics. Perfect for archiving or offline printing.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      downloadPrintableHtml(result);
                      setPrintActionFeedback('Standalone Printable Report downloaded! Double-click to open in browser and print or save as PDF.');
                    }}
                    className="mt-4 w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Report</span>
                  </button>
                </div>

                {/* 3. Plain Text Academic Summary */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 rounded-xl transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Text Summary (.txt)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Clean plain-text integrity certificate designed for LMS submission, email attachments, or student portfolios.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      exportAcademicTextSummary(result);
                      setPrintActionFeedback('Academic plain-text summary downloaded!');
                    }}
                    className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Plain Text</span>
                  </button>
                </div>
              </div>

              {/* Data Export Secondary Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                <span className="text-slate-400">
                  Additional export formats for research citation managers & LMS platforms:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      exportBibTeX(result.citations);
                      setPrintActionFeedback('BibTeX reference citations downloaded!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-sky-400" />
                    <span>BibTeX (.bib)</span>
                  </button>

                  <button
                    onClick={() => {
                      exportFullJsonReport(result);
                      setPrintActionFeedback('Complete JSON audit telemetry downloaded!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Raw JSON (.json)</span>
                  </button>
                </div>
              </div>

              {/* Live Print Paper Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Official Document Print Preview (Paper Layout)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Standard A4 / Letter Academic Certificate
                  </span>
                </div>

                <div className="p-6 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-300 font-serif leading-relaxed text-xs space-y-4 max-h-80 overflow-y-auto selection:bg-teal-100">
                  {/* Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                        VeriDoc Academic™ Integrity Certification
                      </h4>
                      <p className="text-[11px] text-slate-600 font-sans">
                        Comprehensive Academic Integrity & Citation Verification
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-mono">
                      <div>ID: {result.id}</div>
                      <div>{new Date(result.scanTimestamp).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-sans bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Document Title</span>
                      <span className="font-semibold text-slate-800 truncate block">{result.documentTitle}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Standard</span>
                      <span className="font-semibold text-slate-800 capitalize">{result.academicLevel.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Word Count</span>
                      <span className="font-semibold text-slate-800 font-mono">{result.wordCount.toLocaleString()} words</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Estimated Pages</span>
                      <span className="font-semibold text-slate-800 font-mono">~{result.pageCountEstimate} pages</span>
                    </div>
                  </div>

                  {/* Score Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-sans">
                    <div className={`p-2 rounded border ${result.overallSimilarityPercent > 20 ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>
                      <div className="text-lg font-bold font-mono">{result.overallSimilarityPercent}%</div>
                      <div className="text-[9px] uppercase font-bold">Similarity Index</div>
                    </div>
                    <div className={`p-2 rounded border ${result.aiWritingScorePercent > 40 ? 'border-rose-300 bg-rose-50 text-rose-700' : result.aiWritingScorePercent > 20 ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-cyan-300 bg-cyan-50 text-cyan-700'}`}>
                      <div className="text-lg font-bold font-mono">{result.aiWritingScorePercent}%</div>
                      <div className="text-[9px] uppercase font-bold">AI Writing Score</div>
                    </div>
                    <div className="p-2 rounded border border-sky-300 bg-sky-50 text-sky-700">
                      <div className="text-lg font-bold font-mono">{result.originalityScorePercent}%</div>
                      <div className="text-[9px] uppercase font-bold">Human Original</div>
                    </div>
                    <div className="p-2 rounded border border-teal-300 bg-teal-50 text-teal-700">
                      <div className="text-lg font-bold font-mono">{result.citationAudit.styleConsistencyScore}%</div>
                      <div className="text-[9px] uppercase font-bold">Citation Score</div>
                    </div>
                    <div className={`p-2 rounded border col-span-2 sm:col-span-1 ${result.integrityVerdict.includes('High') ? 'border-rose-300 bg-rose-50 text-rose-800' : result.integrityVerdict.includes('Significant') || result.integrityVerdict.includes('Minor') ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>
                      <div className="text-xs font-bold mt-1 line-clamp-1">{result.integrityVerdict}</div>
                      <div className="text-[9px] uppercase font-bold mt-1">Verdict</div>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="bg-slate-50 border-l-4 border-teal-600 p-3 text-[11px] font-sans text-slate-700">
                    <strong className="text-slate-900 block mb-1">Executive Scholarly Assessment:</strong>
                    {result.executiveSummary}
                  </div>

                  {/* Rubric snippet if present */}
                  {result.rubric && (
                    <div className="border border-slate-200 rounded p-3 font-sans">
                      <div className="flex justify-between items-center mb-1">
                        <strong className="text-xs text-slate-900">
                          Instructor Evaluation: Grade {result.rubric.letterGrade} ({result.rubric.totalScore}%)
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-600">{result.rubric.overallEvaluation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Security/Sandbox Notice */}
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Preview note:</strong> Because browsers run web sandboxes inside security iframes, direct browser print dialogs might occasionally be suppressed by host browser policies. If <code className="text-teal-300 font-mono">window.print()</code> does not open a dialog, use <strong>"Download Official Report"</strong> above to open the standalone file in any tab and print or Save as PDF without any sandbox restrictions.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                VeriDoc Academic™ · All reports cryptographically verified
              </span>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintActionFeedback(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
