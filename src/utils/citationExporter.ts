import { ScanResult, CitationItem } from '../types';

export function exportBibTeX(citations: CitationItem[], filename: string = 'citations.bib') {
  const content = citations
    .map((c, i) => {
      if (c.styleConformity?.bibtex) return c.styleConformity.bibtex;
      const author = c.authors[0]?.replace(/[^a-zA-Z]/g, '') || `source${i}`;
      const year = c.year || '2023';
      const cleanKey = `${author.toLowerCase()}${year}`;
      return `@article{${cleanKey},
  author = {${c.authors.join(' and ')}},
  title = {${c.title}},
  journal = {${c.publication || 'Academic Literature'}},
  year = {${c.year}}
}`;
    })
    .join('\n\n');

  downloadBlob(content, filename, 'text/plain');
}

export function exportFormattedCitationsText(
  citations: CitationItem[],
  style: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee',
  filename: string = 'references.txt'
) {
  const lines = citations.map((c, idx) => {
    return c.styleConformity?.[style] || `${idx + 1}. ${c.authors.join(', ')} (${c.year}). ${c.title}.`;
  });

  const header = `=== VERIDOC ACADEMIC - CITATION AUDIT REFERENCES (${style.toUpperCase()}) ===\nGenerated: ${new Date().toLocaleString()}\nTotal Citations: ${citations.length}\n\n`;
  downloadBlob(header + lines.join('\n\n'), filename, 'text/plain');
}

export function exportBatchSummaryCSV(results: ScanResult[], filename: string = 'plagiarism_batch_summary.csv') {
  const headers = [
    'Document Title',
    'Word Count',
    'Page Count',
    'Overall Similarity %',
    'Originality %',
    'Academic Journals %',
    'Internet Sources %',
    'Student Repo %',
    'Paraphrase Risk %',
    'Matched Segments Count',
    'In-Text Citations',
    'Bibliography Entries',
    'Citation Integrity Score',
    'Academic Verdict',
    'Scan Date',
  ];

  const rows = results.map((r) => [
    `"${r.documentTitle.replace(/"/g, '""')}"`,
    r.wordCount,
    r.pageCountEstimate,
    `${r.overallSimilarityPercent}%`,
    `${r.originalityScorePercent}%`,
    `${r.sourcesBreakdown.academicJournalsPercent}%`,
    `${r.sourcesBreakdown.internetSourcesPercent}%`,
    `${r.sourcesBreakdown.studentRepositoryPercent}%`,
    `${r.paraphraseRiskPercent}%`,
    r.matchedSegments.length,
    r.citationAudit?.totalInTextCitations ?? 0,
    r.citationAudit?.totalBibliographyEntries ?? 0,
    `${r.citationAudit?.styleConsistencyScore ?? 80}%`,
    `"${r.integrityVerdict}"`,
    `"${new Date(r.scanTimestamp).toLocaleString()}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv');
}

export function exportFullJsonReport(result: ScanResult) {
  const jsonStr = JSON.stringify(result, null, 2);
  downloadBlob(jsonStr, `${result.documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_integrity_report.json`, 'application/json');
}

export function generateAcademicReportHtml(result: ScanResult): string {
  const matchedSegments = result.matchedSegments || [];
  const citations = result.citations || [];
  const sourcesBreakdown = result.sourcesBreakdown || {
    academicJournalsPercent: 0,
    internetSourcesPercent: 0,
    studentRepositoryPercent: 0,
  };
  const citationAudit = result.citationAudit || {
    totalInTextCitations: 0,
    totalBibliographyEntries: 0,
    orphanInTextCount: 0,
    styleConsistencyScore: 80,
    detectedPrimaryStyle: 'APA 7th',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VeriDoc Academic - Plagiarism & Citation Report: ${escapeHtml(result.documentTitle || 'Academic_Report')}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1e293b;
      margin: 40px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      margin-bottom: 24px;
      font-family: Arial, sans-serif;
      font-size: 13px;
    }
    .meta-item strong { display: block; color: #64748b; font-size: 11px; text-transform: uppercase; }
    .score-banner {
      display: flex;
      gap: 20px;
      margin-bottom: 28px;
      font-family: Arial, sans-serif;
    }
    .score-card {
      flex: 1;
      padding: 16px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      text-align: center;
    }
    .score-val {
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
    }
    .score-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
    }
    .highlight-box {
      background: #f1f5f9;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-style: italic;
    }
    h2, h3 {
      font-family: Arial, sans-serif;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 28px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: Arial, sans-serif;
      font-size: 13px;
      margin-bottom: 24px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
    }
    .match-exact { background: #fee2e2; }
    .match-para { background: #fef3c7; }
    .match-cite { background: #f3e8ff; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">VeriDoc Academic™</div>
      <div style="font-size: 14px; color: #64748b;">Comprehensive Academic Integrity & Citation Audit Report</div>
    </div>
    <div style="text-align: right; font-family: Arial; font-size: 12px; color: #64748b;">
      Scan ID: ${result.id}<br>
      Date: ${result.scanTimestamp ? new Date(result.scanTimestamp).toLocaleString() : new Date().toLocaleString()}
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><strong>Document Title</strong>${escapeHtml(result.documentTitle || 'Academic Submission')}</div>
    <div class="meta-item"><strong>Academic Level</strong>${(result.academicLevel || 'undergraduate').toUpperCase().replace('_', ' ')}</div>
    <div class="meta-item"><strong>Word Count</strong>${(result.wordCount || 0).toLocaleString()} words</div>
    <div class="meta-item"><strong>Estimated Pages</strong>${result.pageCountEstimate || 1} pages</div>
  </div>

  <div class="score-banner">
    <div class="score-card" style="border-top: 4px solid ${(result.overallSimilarityPercent || 0) > 20 ? '#dc2626' : '#16a34a'};">
      <div class="score-val" style="color: ${(result.overallSimilarityPercent || 0) > 20 ? '#dc2626' : '#16a34a'};">${result.overallSimilarityPercent ?? 0}%</div>
      <div class="score-label">Similarity Index</div>
    </div>
    <div class="score-card" style="border-top: 4px solid ${(result.aiWritingScorePercent || 0) > 40 ? '#dc2626' : (result.aiWritingScorePercent || 0) > 20 ? '#f59e0b' : '#06b6d4'};">
      <div class="score-val" style="color: ${(result.aiWritingScorePercent || 0) > 40 ? '#dc2626' : (result.aiWritingScorePercent || 0) > 20 ? '#f59e0b' : '#0891b2'};">${result.aiWritingScorePercent ?? 0}%</div>
      <div class="score-label">AI Writing Score</div>
    </div>
    <div class="score-card" style="border-top: 4px solid #0284c7;">
      <div class="score-val" style="color: #0284c7;">${result.originalityScorePercent ?? 100}%</div>
      <div class="score-label">Human Originality</div>
    </div>
    <div class="score-card" style="border-top: 4px solid #8b5cf6;">
      <div class="score-val" style="color: #8b5cf6;">${citationAudit.styleConsistencyScore}%</div>
      <div class="score-label">Citation Consistency</div>
    </div>
    <div class="score-card" style="border-top: 4px solid #f59e0b;">
      <div class="score-val" style="font-size: 16px; line-height: 38px; color: #0f172a;">${escapeHtml(result.integrityVerdict || 'Acceptable')}</div>
      <div class="score-label">Integrity Verdict</div>
    </div>
  </div>

  <div class="highlight-box">
    <strong>Executive Scholarly Assessment:</strong><br>
    ${escapeHtml(result.executiveSummary || 'Academic integrity audit completed successfully.')}
  </div>

  <h2>1. Source Category Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Repository Category</th>
        <th>Similarity Proportion</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Academic Journals & Publications</strong></td>
        <td>${sourcesBreakdown.academicJournalsPercent}%</td>
        <td>Peer-reviewed research, IEEE, ScienceDirect, JSTOR, arXiv, PubMed</td>
      </tr>
      <tr>
        <td><strong>Internet & Educational Publications</strong></td>
        <td>${sourcesBreakdown.internetSourcesPercent}%</td>
        <td>Scholarly websites, institutional portals (.edu / .org), open encyclopedias</td>
      </tr>
      <tr>
        <td><strong>Student Paper Repository</strong></td>
        <td>${sourcesBreakdown.studentRepositoryPercent}%</td>
        <td>Cross-institutional student paper archive & past thesis submissions</td>
      </tr>
    </tbody>
  </table>

  <h2>2. AI-Writing & Synthetic Text Evaluation</h2>
  <table>
    <thead>
      <tr>
        <th>Metric Category</th>
        <th>Measured Proportion</th>
        <th>Methodological Finding</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Overall AI-Writing Indicator</strong></td>
        <td><strong>${result.aiWritingScorePercent || 0}%</strong></td>
        <td>Overall confidence: ${result.aiConfidence || 'Moderate'}</td>
      </tr>
      <tr>
        <td><strong>Verbatim AI-Generated</strong></td>
        <td>${result.aiGeneratedPercent || 0}%</td>
        <td>Segments with uniform token probability and low syntactic perplexity</td>
      </tr>
      <tr>
        <td><strong>AI-Paraphrased / Spun</strong></td>
        <td>${result.aiParaphrasedPercent || 0}%</td>
        <td>Hybrid segments displaying lexical substitution patterns</td>
      </tr>
      <tr>
        <td><strong>Human-Authored Prose</strong></td>
        <td>${result.humanWrittenPercent || 100}%</td>
        <td>Natural syntactic variance and organic voice</td>
      </tr>
    </tbody>
  </table>

  <h2>3. Flagged Text Matches (${matchedSegments.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Flagged Sentence / Passage</th>
        <th>Match Type</th>
        <th>Similarity</th>
        <th>Matched Source & Author</th>
        <th>Audit Guidance</th>
      </tr>
    </thead>
    <tbody>
      ${matchedSegments
        .map(
          (m) => `
        <tr class="${m.severity === 'exact' ? 'match-exact' : m.severity === 'paraphrased' ? 'match-para' : 'match-cite'}">
          <td style="font-size: 12px;">"${escapeHtml(m.matchedText)}"</td>
          <td style="font-size: 11px; text-transform: uppercase; font-weight: bold;">${m.severity.replace('_', ' ')}</td>
          <td>${m.similarityScore}%</td>
          <td style="font-size: 12px;"><strong>${escapeHtml(m.sourceTitle)}</strong><br>${escapeHtml(m.sourceAuthor)} (${m.sourceYear})</td>
          <td style="font-size: 11px;">${escapeHtml(m.recommendation)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <h2>4. Citation & Attribution Integrity Audit</h2>
  <div class="meta-grid">
    <div class="meta-item"><strong>In-Text Citations Detected</strong>${citationAudit.totalInTextCitations}</div>
    <div class="meta-item"><strong>Bibliography Entries</strong>${citationAudit.totalBibliographyEntries}</div>
    <div class="meta-item"><strong>Orphan Citations (Unlisted)</strong>${citationAudit.orphanInTextCount}</div>
    <div class="meta-item"><strong>Primary Style Detected</strong>${citationAudit.detectedPrimaryStyle}</div>
  </div>

  <h3>Formally Audited Citations (${citations.length})</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Author(s) & Year</th>
        <th>Title</th>
        <th>In-Text</th>
        <th>Bibliography</th>
        <th>Standard APA 7th Reference</th>
      </tr>
    </thead>
    <tbody>
      ${citations
        .map(
          (c, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(c.authors.join(', '))} (${c.year})</td>
          <td>${escapeHtml(c.title)}</td>
          <td>${c.inTextFound ? '✓ Yes' : '✗ Missing'}</td>
          <td>${c.bibliographyFound ? '✓ Yes' : '✗ Missing'}</td>
          <td style="font-size: 11px;">${escapeHtml(c.styleConformity?.apa || '')}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  ${
    result.coachingChecklist && result.coachingChecklist.length > 0
      ? `
  <h2>5. Draft Coach Academic Guidance Checklist</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Checklist Item</th>
        <th>Status</th>
        <th>Recommended Action</th>
      </tr>
    </thead>
    <tbody>
      ${result.coachingChecklist
        .map(
          (coach) => `
        <tr>
          <td style="text-transform: capitalize; font-weight: bold;">${coach.category}</td>
          <td><strong>${escapeHtml(coach.title)}</strong><br><span style="font-size: 11px; color: #64748b;">${escapeHtml(coach.detail)}</span></td>
          <td><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${coach.status === 'passed' ? '#dcfce7; color: #166534;' : coach.status === 'needs_work' ? '#fef3c7; color: #92400e;' : '#fee2e2; color: #991b1b;'}">${coach.status.toUpperCase().replace('_', ' ')}</span></td>
          <td style="font-size: 12px;">${escapeHtml(coach.actionStep)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>`
      : ''
  }

  ${
    result.rubric
      ? `
  <h2>6. Official Instructor Evaluation & Rubric Grade</h2>
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div>
        <strong style="font-size: 18px;">Overall Evaluation: Grade ${result.rubric.letterGrade} (${result.rubric.totalScore}%)</strong>
        <div style="font-size: 13px; color: #475569; margin-top: 4px;">${escapeHtml(result.rubric.overallEvaluation)}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Evaluation Criterion</th>
          <th>Weight</th>
          <th>Assigned Score</th>
          <th>Instructor Feedback</th>
        </tr>
      </thead>
      <tbody>
        ${result.rubric.criteria
          .map(
            (crit) => `
          <tr>
            <td><strong>${escapeHtml(crit.name)}</strong></td>
            <td>${crit.weight}%</td>
            <td><strong>${crit.score} / ${crit.maxScore}</strong></td>
            <td style="font-size: 12px;">${escapeHtml(crit.feedback)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>`
      : ''
  }

  ${
    result.granularStats
      ? `
  <h2>7. Granular Linguistic & Accuracy Telemetry</h2>
  <div class="meta-grid">
    <div class="meta-item"><strong>Flesch-Kincaid Grade Level</strong>${result.granularStats.fleschKincaidGradeLevel}</div>
    <div class="meta-item"><strong>Reading Ease Score</strong>${result.granularStats.fleschReadingEase} / 100</div>
    <div class="meta-item"><strong>Lexical Diversity (TTR)</strong>${result.granularStats.lexicalDiversityTTR}%</div>
    <div class="meta-item"><strong>Accuracy Confidence</strong>${result.granularStats.accuracyConfidenceScore}%</div>
  </div>`
      : ''
  }

  <h2>8. Scanned Document Body</h2>
  <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; font-family: 'Times New Roman', Times, serif; font-size: 13px; line-height: 1.8; white-space: pre-wrap;">${escapeHtml(result.scannedText)}</div>

  <div class="no-print" style="margin-top: 40px; padding: 20px; background: #f1f5f9; border-radius: 8px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 28px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
      🖨️ Print Document / Save as PDF
    </button>
    <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
      Tip: Choose "Save as PDF" in your browser print prompt to generate an official digital archive copy.
    </div>
  </div>
</body>
</html>`;

  return html;
}

export function exportAcademicTextSummary(result: ScanResult) {
  const content = `================================================================================
VERIDOC ACADEMIC™ - OFFICIAL INTEGRITY & CITATION AUDIT REPORT
================================================================================
Document Title:    ${result.documentTitle}
Academic Level:    ${(result.academicLevel || 'undergraduate').toUpperCase().replace('_', ' ')}
Scan Timestamp:    ${new Date(result.scanTimestamp).toLocaleString()}
Scan ID:           ${result.id}
Word Count:        ${result.wordCount.toLocaleString()} words (${result.pageCountEstimate} pages)

--------------------------------------------------------------------------------
CORE METRICS & INTEGRITY ASSESSMENT
--------------------------------------------------------------------------------
Overall Similarity Index:    ${result.overallSimilarityPercent}%
Human Originality:           ${result.originalityScorePercent}%
Paraphrase Overlap Risk:     ${result.paraphraseRiskPercent}%
AI Writing Probability:      ${result.aiWritingScorePercent}% (${result.humanWrittenPercent}% Human)
Integrity Verdict:           ${result.integrityVerdict}

SOURCES BREAKDOWN:
- Academic Journals & Peer Review: ${result.sourcesBreakdown.academicJournalsPercent}%
- Internet & Educational Sources:  ${result.sourcesBreakdown.internetSourcesPercent}%
- Student Paper Repositories:      ${result.sourcesBreakdown.studentRepositoryPercent}%

CITATION & REFERENCING AUDIT:
- Primary Detected Style:   ${result.citationAudit.detectedPrimaryStyle}
- Citation Integrity Score: ${result.citationAudit.styleConsistencyScore}%
- In-Text Citations Found:  ${result.citationAudit.totalInTextCitations}
- Works Cited / References: ${result.citationAudit.totalBibliographyEntries}
- Orphan In-Text Citations: ${result.citationAudit.orphanInTextCount}

EXECUTIVE ASSESSMENT:
${result.executiveSummary}

${
  result.rubric
    ? `EVALUATION & GRADE:
Letter Grade: ${result.rubric.letterGrade} (${result.rubric.totalScore}%)
${result.rubric.overallEvaluation}`
    : ''
}

================================================================================
Generated by VeriDoc Academic™ Intelligence Engine
================================================================================
`;
  const cleanTitle = (result.documentTitle || 'Academic_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadBlob(content, `${cleanTitle}_Integrity_Summary.txt`, 'text/plain');
}

export function downloadPrintableHtml(result: ScanResult) {
  const html = generateAcademicReportHtml(result);
  const cleanTitle = (result.documentTitle || 'Academic_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadBlob(html, `${cleanTitle}_VeriDoc_Academic_Report.html`, 'text/html');
}

export function printAcademicReport(result: ScanResult) {
  try {
    window.print();
  } catch (e) {
    console.warn('Window print failed, downloading printable standalone HTML:', e);
  }
  // Also offer immediate download fallback so user is never blocked by iframe
  downloadPrintableHtml(result);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
