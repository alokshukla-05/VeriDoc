import * as mammoth from 'mammoth';

export interface ParsedDocumentOutput {
  text: string;
  wordCount: number;
  characterCount: number;
  pageCountEstimate: number;
  format: string;
}

export async function parseFileToText(file: File): Promise<ParsedDocumentOutput> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  let extractedText = '';

  try {
    if (['txt', 'text', 'md', 'markdown', 'tex', 'latex', 'rtf', 'html', 'htm', 'csv', 'tsv', 'bib'].includes(extension)) {
      extractedText = await file.text();
      // If HTML, strip script/style tags
      if (['html', 'htm'].includes(extension)) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(extractedText, 'text/html');
        extractedText = doc.body.textContent || extractedText;
      }
      // If RTF, strip control words if simple
      if (extension === 'rtf') {
        extractedText = cleanRtfText(extractedText);
      }
    } else if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      // mammoth browser bundle works with arrayBuffer
      const result = await (mammoth as any).extractRawText({ arrayBuffer });
      extractedText = result.value || '';
    } else if (extension === 'pdf') {
      // Extract PDF using pdfjs or backend endpoint fallback
      extractedText = await extractPdfText(file);
    } else if (['doc', 'odt'].includes(extension)) {
      // Send to server parser or extract readable ASCII/UTF strings
      extractedText = await extractViaServerOrBuffer(file);
    } else {
      // Fallback: try plain text
      extractedText = await file.text();
    }
  } catch (err) {
    console.warn(`Local parse error for ${file.name}, trying backend fallback:`, err);
    extractedText = await extractViaServerOrBuffer(file);
  }

  // Normalize whitespace
  extractedText = extractedText.replace(/\r\n/g, '\n').trim();

  const words = extractedText ? extractedText.split(/\s+/).filter(w => w.length > 0) : [];
  const wordCount = words.length;
  const characterCount = extractedText.length;
  // Standard academic page estimate: ~275 words per page (double spaced 12pt)
  const pageCountEstimate = Math.max(1, Math.ceil(wordCount / 275));

  return {
    text: extractedText,
    wordCount,
    characterCount,
    pageCountEstimate,
    format: extension.toUpperCase() || 'TXT',
  };
}

// Convert File to base64 string safely
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  // Primary: High-fidelity Server-side PDF extraction with pdf-parse
  try {
    const base64Data = await fileToBase64(file);
    const res = await fetch('/api/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: file.name,
        base64Data,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text && data.text.trim().length > 0) {
        return data.text.trim();
      }
    }
  } catch (backendErr) {
    console.warn('Backend PDF extraction failed, attempting client-side fallback:', backendErr);
  }

  // Client-side fallback with PDF.js
  try {
    const pdfjsLib = await import('pdfjs-dist');
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdfDoc = await loadingTask.promise;
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageStrings + '\n\n';
    }
    if (fullText.trim().length > 0) {
      return fullText.trim();
    }
  } catch (pdfErr) {
    console.warn('PDF.js client parsing error:', pdfErr);
  }

  // Graceful buffer fallback: extract readable UTF-8 strings
  return await extractViaServerOrBuffer(file);
}

async function extractViaServerOrBuffer(file: File): Promise<string> {
  try {
    const base64Data = await fileToBase64(file);
    const res = await fetch('/api/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: file.name,
        base64Data,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text && data.text.trim().length > 0) return data.text.trim();
    }
  } catch (e) {
    console.warn('Backend parse error:', e);
  }

  // Fallback: extract readable text from buffer
  try {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(buffer);
    const printable = raw.replace(/[^\x20-\x7E\t\n\r]/g, ' ');
    return printable.replace(/\s{2,}/g, ' ').trim();
  } catch {
    return '';
  }
}

function cleanRtfText(rtf: string): string {
  // basic RTF text cleaner
  return rtf
    .replace(/\\par[d]?/g, '\n')
    .replace(/\{\\*?\\[^{}]+;?\}|\\([A-Za-z0-9]+) ?|[\{\}]/g, '')
    .trim();
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
