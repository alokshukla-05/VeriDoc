export type AcademicLevel = 'high_school' | 'undergraduate' | 'postgraduate' | 'journal_publication';

export type MatchSeverity = 'exact' | 'paraphrased' | 'missing_citation' | 'proper_quote';

export type SourceType = 'journal' | 'internet' | 'student_repo' | 'book';

export type AIClassification = 'ai_generated' | 'ai_paraphrased' | 'human';

export interface MatchedSegment {
  id: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  similarityScore: number; // 0 - 100
  severity: MatchSeverity;
  sourceTitle: string;
  sourceAuthor: string;
  sourceYear: string;
  sourceType: SourceType;
  sourcePublication?: string;
  sourceUrl?: string;
  doi?: string;
  sourceExcerpt: string;
  recommendation: string;
  citationFoundInDoc: boolean;
  excluded?: boolean;
  matchedWordCount?: number;
}

export interface AISegment {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  classification: AIClassification;
  confidence: number; // 0 - 100
  modelClues: string[];
  explanation: string;
}

export interface DetailedSentenceAudit {
  id: string;
  sentenceIndex: number;
  text: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  status: 'original' | 'exact_match' | 'paraphrased' | 'missing_citation' | 'proper_quote' | 'ai_generated';
  similarityPercent: number;
  aiProbabilityPercent: number;
  matchedSourceTitle?: string;
  matchedSourceAuthor?: string;
  matchedSourceDoi?: string;
  recommendation?: string;
}

export interface GranularDocumentStats {
  totalSentences: number;
  avgSentenceLengthWords: number;
  uniqueWordsCount: number;
  lexicalDiversityTTR: number; // 0 - 100 Type-Token Ratio
  fleschKincaidGradeLevel: number;
  fleschReadingEase: number;
  matchingWordsCount: number;
  nonMatchingWordsCount: number;
  exactMatchWordsCount: number;
  paraphrasedWordsCount: number;
  accuracyConfidenceScore: number; // e.g. 99.4%
  characterCountWithoutSpaces: number;
}

export interface AggregatedSourceMatch {
  sourceTitle: string;
  sourceAuthor: string;
  sourceYear: string;
  sourceType: SourceType;
  sourceUrl?: string;
  doi?: string;
  matchedWordCount: number;
  percentageOfDoc: number;
  segmentsCount: number;
  isExcluded: boolean;
}

export interface GrammarFeedbackItem {
  id: string;
  category: 'grammar' | 'mechanics' | 'clarity' | 'academic_tone' | 'passive_voice';
  originalText: string;
  suggestedText: string;
  startIndex: number;
  endIndex: number;
  explanation: string;
  ruleTitle: string;
}

export interface CitationItem {
  id: string;
  rawText: string;
  authors: string[];
  year: string;
  title: string;
  publication?: string;
  inTextFound: boolean;
  bibliographyFound: boolean;
  status: 'valid' | 'missing_in_text' | 'missing_in_bibliography' | 'improper_format';
  styleConformity: {
    apa: string;
    mla: string;
    chicago: string;
    harvard: string;
    ieee: string;
    bibtex: string;
  };
  notes?: string;
}

export interface CitationAuditSummary {
  totalInTextCitations: number;
  totalBibliographyEntries: number;
  matchedCitations: number;
  orphanInTextCount: number;
  phantomBibliographyCount: number;
  styleConsistencyScore: number;
  detectedPrimaryStyle: 'APA 7th' | 'MLA 9th' | 'Chicago' | 'IEEE' | 'Harvard' | 'Mixed';
  recommendations: string[];
}

export interface CoachingChecklistItem {
  id: string;
  category: 'similarity' | 'citations' | 'grammar' | 'structure';
  title: string;
  status: 'passed' | 'needs_work' | 'warning';
  detail: string;
  actionStep: string;
}

export interface InstructorComment {
  id: string;
  startIndex: number;
  endIndex: number;
  selectedText: string;
  author: string;
  timestamp: string;
  commentText: string;
  type: 'inline' | 'quickmark';
  quickmarkTag?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  feedback: string;
}

export interface RubricAssessment {
  criteria: RubricCriterion[];
  totalScore: number;
  letterGrade: string;
  overallEvaluation: string;
}

export interface ScanResult {
  id: string;
  documentTitle: string;
  fileName?: string;
  fileSizeFormatted?: string;
  wordCount: number;
  characterCount: number;
  pageCountEstimate: number;
  scanTimestamp: string;
  academicLevel: AcademicLevel;
  
  // 1. Similarity Checking
  overallSimilarityPercent: number;
  originalityScorePercent: number;
  paraphraseRiskPercent: number;
  sourcesBreakdown: {
    academicJournalsPercent: number;
    internetSourcesPercent: number;
    studentRepositoryPercent: number;
  };
  matchedSegments: MatchedSegment[];
  sourceMatchesAggregated?: AggregatedSourceMatch[];

  // 2. AI Writing Detection
  aiWritingScorePercent: number;
  aiGeneratedPercent: number;
  aiParaphrasedPercent: number;
  humanWrittenPercent: number;
  aiConfidence: 'Low' | 'Moderate' | 'High';
  aiSegments: AISegment[];
  aiDetectionSummary: string;

  // 3. Granular Sentence Matrix & Accuracy Telemetry
  detailedSentences?: DetailedSentenceAudit[];
  granularStats?: GranularDocumentStats;

  // 4. Citation & Referencing Checks
  citations: CitationItem[];
  citationAudit: CitationAuditSummary;
  grammarIssues: GrammarFeedbackItem[];
  grammarScore: number;

  // 5. Draft Coach Guidance
  coachingChecklist: CoachingChecklistItem[];
  draftNumber: number;
  draftAttemptsRemaining: number;

  // 6. Instructor Feedback & Grading
  instructorComments: InstructorComment[];
  rubric: RubricAssessment;
  instructorSummary: {
    generalRemarks: string;
    strengths: string[];
    areasForImprovement: string[];
  };

  executiveSummary: string;
  integrityVerdict:
    | 'Acceptable - Original Content'
    | 'Minor Attribution Issues'
    | 'High Plagiarism Detected'
    | 'Significant Revision Required'
    | 'High AI Authorship Detected'
    | 'Significant AI Writing Detected'
    | 'Minor Synthetic Variations';
  scannedText: string;
}

export interface DocumentQueueItem {
  id: string;
  file?: File;
  title: string;
  sizeFormatted: string;
  rawText: string;
  wordCount: number;
  status: 'queued' | 'extracting' | 'scanning' | 'completed' | 'error';
  progress: number;
  result?: ScanResult;
  errorMessage?: string;
  addedAt: string;
}

export interface ScanOptions {
  excludeQuotes: boolean;
  excludeBibliography: boolean;
  excludeSmallMatches: boolean;
  academicLevel: AcademicLevel;
  sensitivityLevel: 'standard' | 'high' | 'strict';
}
