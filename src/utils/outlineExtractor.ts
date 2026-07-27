import { FileStats, OutlineItem } from '../types';

/**
 * Helper to produce clean URL-friendly slugs from heading text
 */
export function slugifyHeading(text: string): string {
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'heading';
}

/**
 * Extract outline items from raw Markdown text
 */
export function extractMarkdownOutline(markdownText: string): OutlineItem[] {
  if (!markdownText) return [];

  const outlineItems: OutlineItem[] = [];
  const lines = markdownText.split('\n');
  let inCodeBlock = false;
  let codeBlockFence = '';
  const slugCounts = new Map<string, number>();

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();

    // Check for code blocks ``` or ~~~
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      const fence = trimmed.substring(0, 3);
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockFence = fence;
      } else if (trimmed.startsWith(codeBlockFence)) {
        inCodeBlock = false;
        codeBlockFence = '';
      }
      continue;
    }

    if (inCodeBlock) continue;

    // Match ATX headers # H1, ## H2, ### H3, #### H4, ##### H5, ###### H6
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      let rawText = headerMatch[2].replace(/\s+#+\s*$/, '').trim();

      // Strip markdown formatting like bold **, italics *, links [], code ``
      const cleanText = rawText
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/`([^`]+)`/g, '$1') // inline code
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold/italics
        .replace(/~~([^~]+)~~/g, '$1'); // strikethrough

      const slug = slugifyHeading(cleanText);
      const count = (slugCounts.get(slug) || 0) + 1;
      slugCounts.set(slug, count);

      const elementId = `hd-${slug}-${count}`;

      outlineItems.push({
        id: `outline-${index}`,
        text: cleanText,
        level,
        elementId,
        line: index + 1
      });
      continue;
    }

    // Match Setext headers (Header line followed by === or ---)
    if (index < lines.length - 1) {
      const nextLineTrimmed = lines[index + 1].trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('>') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        let setextLevel = 0;
        if (/^={2,}\s*$/.test(nextLineTrimmed)) {
          setextLevel = 1;
        } else if (/^-{2,}\s*$/.test(nextLineTrimmed)) {
          setextLevel = 2;
        }

        if (setextLevel > 0) {
          const cleanText = trimmed
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
            .replace(/~~([^~]+)~~/g, '$1');

          const slug = slugifyHeading(cleanText);
          const count = (slugCounts.get(slug) || 0) + 1;
          slugCounts.set(slug, count);

          const elementId = `hd-${slug}-${count}`;

          outlineItems.push({
            id: `outline-${index}`,
            text: cleanText,
            level: setextLevel,
            elementId,
            line: index + 1
          });
          index++; // skip the underline line
        }
      }
    }
  }

  return outlineItems;
}

/**
 * Extract outline items from HTML rendered from Word document
 */
export function extractHtmlOutline(htmlContent: string): OutlineItem[] {
  if (!htmlContent) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  const outlineItems: OutlineItem[] = [];

  headings.forEach((heading, idx) => {
    const level = parseInt(heading.tagName.replace('H', ''), 10);
    const text = heading.textContent?.trim() || '';
    if (!text) return;

    // Retrieve id injected into Word HTML or fallback
    const elementId = heading.getAttribute('id') || `word-heading-${idx}-${slugifyHeading(text)}`;
    
    outlineItems.push({
      id: `word-outline-${idx}`,
      text,
      level,
      elementId
    });
  });

  return outlineItems;
}

/**
 * Calculate document stats (words, characters, reading time)
 */
export function calculateDocumentStats(text: string): FileStats {
  if (!text) {
    return { wordCount: 0, charCount: 0, readingTimeMinutes: 0, headingsCount: 0 };
  }

  // Count CJK (Chinese, Japanese, Korean) characters
  const cjkChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

  // Count non-CJK words
  const nonCjkWords = text
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const totalWords = cjkChars + nonCjkWords;
  const totalChars = text.length;

  // Average reading speed: 300 CJK characters per minute, or 200 English words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 300));

  const headingsCount = (text.match(/^#{1,6}\s+/gm) || []).length;

  return {
    wordCount: totalWords,
    charCount: totalChars,
    readingTimeMinutes,
    headingsCount
  };
}
