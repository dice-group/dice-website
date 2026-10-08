import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const exec = promisify(execFile);
// Bump whenever parser settings, cleanup, chunk boundaries or overlap change.
export const PIPELINE_VERSION = 3;
const TOKEN_LIMIT = 350;
const OVERLAP_TOKENS = 50;
const MAX_BYTES = 40 * 1024 * 1024;
const REFERENCES = /^(?:(?:\d+(?:\.\d+)*|[IVX]+)[.)]?\s+)?(?:references|bibliography|literature cited)\s*:?[.]?$/i;

export async function requirePdfTools() {
  for (const command of ['pdfinfo', 'pdftotext']) {
    try {
      await exec(command, ['-v'], { timeout: 5000, maxBuffer: 64 * 1024 });
    } catch (error) {
      throw new Error(
        `PDF extraction prerequisite unavailable: ${command}. ` +
          'Install Poppler and ensure pdfinfo and pdftotext are on PATH. ' +
          'On Debian/Ubuntu: sudo apt-get update && sudo apt-get install poppler-utils. ' +
          `No PDFs have been processed. (${error.code || error.message})`,
        { cause: error }
      );
    }
  }
}

export async function downloadPdf(pdfUrl) {
  const url = new URL(pdfUrl);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('PDF URL must use HTTP or HTTPS');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    // Always fetch bytes: validators/URLs alone cannot detect every replacement.
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`PDF HTTP ${response.status}`);
    if (/text\/html/i.test(response.headers.get('content-type') || ''))
      throw new Error('PDF URL returned HTML');
    if (Number(response.headers.get('content-length')) > MAX_BYTES)
      throw new Error('PDF exceeds 40 MiB');
    const buffers = [];
    let size = 0;
    for await (const data of response.body) {
      size += data.length;
      if (size > MAX_BYTES) throw new Error('PDF exceeds 40 MiB');
      buffers.push(data);
    }
    const bytes = Buffer.concat(buffers);
    if (!bytes.subarray(0, 1024).includes(Buffer.from('%PDF-')))
      throw new Error('Response has no PDF signature');
    return bytes;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

export async function extractPdf(bytes) {
  const directory = await mkdtemp(path.join(tmpdir(), 'dice-pdf-'));
  const filename = path.join(directory, 'paper.pdf');
  const options = { timeout: 30000, maxBuffer: 16 * 1024 * 1024 };
  try {
    await writeFile(filename, bytes);
    const { stdout: info } = await exec('pdfinfo', [filename], options);
    if (/^Encrypted:\s+yes/im.test(info))
      throw new Error('Encrypted PDF is not supported');
    const { stdout } = await exec(
      'pdftotext',
      ['-enc', 'UTF-8', '-eol', 'unix', filename, '-'],
      options
    );
    if (stdout.replace(/\s/g, '').length < 100)
      throw new Error(
        'PDF has insufficient extractable text (OCR is not enabled)'
      );
    // Reading order is useful for prose; a separate layout copy preserves
    // table rows and columns without mixing columns throughout the paper.
    const { stdout: layout } = await exec(
      'pdftotext',
      ['-layout', '-enc', 'UTF-8', '-eol', 'unix', filename, '-'],
      options
    );
    return { text: stdout, layout };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function cleanPages(text) {
  const pages = text.split('\f');
  if (!pages[pages.length - 1].trim()) pages.pop();
  const lines = pages.map(page =>
    page
      .normalize('NFKC')
      .split('\n')
      .map(line =>
        line
          .replace(/[\x00-\x08\x0b\x0e-\x1f]/g, '')
          .replace(/\u00ad/g, '')
          .replace(/[ \t]+/g, ' ')
          .trim()
      )
  );
  const repeated = new Map();
  const edgeKey = line => line.toLowerCase().replace(/\d+/g, '#');
  for (const page of lines) {
    const nonempty = page.filter(Boolean);
    for (const key of new Set(
      [...nonempty.slice(0, 2), ...nonempty.slice(-2)]
        .filter(line => line.length < 160)
        .map(edgeKey)
    )) {
      repeated.set(key, (repeated.get(key) || 0) + 1);
    }
  }
  return lines.map(page => {
    const nonempty = page
      .map((line, index) => (line ? index : -1))
      .filter(i => i >= 0);
    const edges = new Set([...nonempty.slice(0, 2), ...nonempty.slice(-2)]);
    return page.filter((line, index) => {
      if (REFERENCES.test(line)) return true;
      if (!edges.has(index)) return true;
      if (/^(?:page\s+)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i.test(line)) return false;
      return (
        (repeated.get(edgeKey(line)) || 0) <
        Math.max(3, Math.ceil(pages.length * 0.5))
      );
    });
  });
}

// Restrict headings to short, title-like language. In particular, equation
// fragments such as "1 E2 , where S represents the" must never change scope.
const NAMED_HEADING = /^(abstract|introduction|background|related work|preliminaries|(?:proposed )?(?:approach|method|methodology|framework)(?:\s*:\s*[\w-]+)?|experiments?(?: and evaluation)?|experimental (?:setup|evaluation|results)|evaluation|results(?: and discussion)?|discussion|conclusions?|limitations(?: and future work)?|future work|acknowledg[e]?ments?)$/i;
function titleLike(value) {
  const words = value.split(/\s+/);
  if (!value || value.length > 120 || words.length > 14) return false;
  if (!/[A-Z][a-z]{2}/.test(value)) return false;
  if (!/^[A-Z]/.test(value) || /[,=<>∑∏∈⊂←→±\\]|\d/.test(value)) return false;
  if (
    /\b(where|represents|denotes|such that|for each|foreach|return|compute|retrieve)\b/i.test(
      value
    )
  )
    return false;
  if (/[.;!?]$/.test(value)) return false;
  const significant = words.filter(
    word => !/^(a|an|the|and|or|of|on|in|for|to|with|by|via|as)$/i.test(word)
  );
  return (
    significant.length > 0 && significant.every(word => /^[A-Z(]/.test(word))
  );
}
function headingAt(lines, index) {
  const line = lines[index].trim();
  const numbered = line.match(/^(\d{1,2}(?:\.\d{1,2}){0,2})[.)]?\s+(.+)$/);
  if (numbered && (titleLike(numbered[2]) || NAMED_HEADING.test(numbered[2])))
    return { number: numbered[1], title: numbered[2], consumed: 1 };
  if (/^\d{1,2}(?:\.\d{1,2}){0,2}[.]?$/.test(line)) {
    let next = index + 1;
    while (next < lines.length && !lines[next].trim()) next++;
    const title = lines[next]?.trim() || '';
    if (titleLike(title) || NAMED_HEADING.test(title))
      return {
        number: line.replace(/\.$/, ''),
        title,
        consumed: next - index + 1,
      };
  }
  if (NAMED_HEADING.test(line))
    return { number: null, title: line, consumed: 1 };
  return null;
}

const TABLE_CAPTION = /^Table\s+\d+[.:]\s*/i;
const FIGURE_CAPTION = /^(?:Fig\.|Figure)\s*\d+[.:]/i;
const wordsOf = value =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [];
function numericRow(line) {
  return (
    (line.match(/(?:^|\s)[+-]?\d+(?:[.,]\d+)?(?:\s|$|±)/g) || []).length >= 2
  );
}
function proseLine(line) {
  return (
    line.trim().split(/\s+/).length >= 9 &&
    !/\S {2,}\S/.test(line.trim()) &&
    !numericRow(line)
  );
}

// Keep layout intact when merged/grouped cells prevent reliable row labeling.
// No dataset/model label is guessed or forward-filled across a merged cell.
function layoutTables(layout) {
  const tables = [];
  for (const [pageIndex, page] of layout.split('\f').entries()) {
    const lines = page.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!TABLE_CAPTION.test(lines[i].trim())) continue;
      const start = i;
      let end = i + 1;
      let rows = 0;
      let bodyStarted = false;
      for (; end < lines.length; end++) {
        const line = lines[end];
        if (
          TABLE_CAPTION.test(line.trim()) ||
          FIGURE_CAPTION.test(line.trim()) ||
          REFERENCES.test(line.trim())
        )
          break;
        if (bodyStarted && (headingAt(lines, end) || proseLine(line))) break;
        if (numericRow(line)) {
          rows++;
          bodyStarted = true;
        }
      }
      if (rows < 2) continue;
      const selected = lines.slice(start, end);
      while (selected.length && !selected[selected.length - 1].trim())
        selected.pop();
      const caption = selected[0].trim();
      // Remove common indentation, preserving the relative column positions.
      const nonempty = selected.filter(line => line.trim());
      const indent = Math.min(...nonempty.map(line => line.search(/\S/)));
      const text = selected
        .map(line => line.slice(indent).trimEnd())
        .join('\n')
        .replace(/[\x00-\x08\x0b\x0e-\x1f]/g, '');
      tables.push({
        text,
        caption,
        page: pageIndex + 1,
        // Use the text AFTER the table as the boundary in reading-order text.
        // Caption/cell vocabulary is not a boundary: Poppler joins hyphenated
        // words differently in the two modes (EN-DE vs ENDE, 10-fold vs 10fold).
        resumeText:
          lines
            .slice(end)
            .find(line => line.trim())
            ?.trim() || '',
        vocabulary: new Set(wordsOf(text)),
      });
      i = end - 1;
    }
  }
  return tables;
}

function figureNoise(lines) {
  const removed = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (!FIGURE_CAPTION.test(lines[i])) continue;
    // Remove only a contiguous run of short diagram labels immediately before
    // the caption. Keep the caption and surrounding explanatory prose.
    let end = i - 1;
    while (end >= 0 && !lines[end]) end--;
    let start = end;
    while (
      start >= 0 &&
      lines[start] &&
      lines[start].split(/\s+/).length <= 6 &&
      !/[.!?]$/.test(lines[start]) &&
      !headingAt(lines, start)
    )
      start--;
    if (end - start >= 4) for (let j = start + 1; j <= end; j++) removed.add(j);
  }
  return removed;
}

function compactText(text) {
  return wordsOf(text).join('');
}

function tableResume(lines, start, table) {
  const remainder = lines.slice(start + 1).join('\n');
  const anchor = compactText(table.resumeText).slice(0, 100);
  if (anchor.length >= 20) {
    // Keep character offsets so a prose continuation sharing a line with the
    // final table cells can be retained without retaining those cells.
    let normalized = '';
    const offsets = [];
    let position = 0;
    for (const character of remainder) {
      const value = compactText(character);
      normalized += value;
      for (let j = 0; j < value.length; j++) offsets.push(position);
      position += character.length;
    }
    const match = normalized.indexOf(anchor);
    if (match >= 0) {
      const offset = offsets[match];
      const before = remainder.slice(0, offset);
      const lineOffset = before.split('\n').length - 1;
      const index = start + 1 + lineOffset;
      const column = offset - (before.lastIndexOf('\n') + 1);
      return { index, text: lines[index].slice(column) };
    }
  }

  // Fallback for missing/differently ordered layout anchors. A caption mismatch
  // must not end suppression. Wait for numeric table content, then a genuine
  // prose/heading boundary; short headers such as "Method" remain suppressed.
  let sawValues = false;
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index];
    if (
      TABLE_CAPTION.test(line) ||
      FIGURE_CAPTION.test(line) ||
      REFERENCES.test(line)
    )
      return { index, text: line };
    if (numericRow(line) || /^\s*[+-]?\d+[.,]\d+/.test(line)) sawValues = true;
    const tokens = wordsOf(line);
    const unknown = tokens.filter(token => !table.vocabulary.has(token));
    const heading = headingAt(lines, index);
    if (
      sawValues &&
      unknown.length &&
      ((heading && (heading.number || tokens.length >= 2)) ||
        (tokens.length >= 6 && unknown.length >= 3 && !numericRow(line)))
    )
      return { index, text: line };
  }
  return { index: lines.length, text: '' };
}

function equationLine(line) {
  // Require mathematical evidence, not just short text or an acronym.
  const hasMath = /[=∑∏∈⊂≤≥←]|(?:\^|_)[\w{]/.test(line);
  const proseWords = line.match(/\b[A-Za-z]{3,}\b/g) || [];
  return hasMath && proseWords.length < 5;
}

async function tokenCount(tokenizer, text) {
  return (await tokenizer(text, { truncation: false, padding: false }))
    .input_ids.data.length;
}

async function wordEnd(words, start, budget, tokenizer) {
  let low = start + 1;
  let high = Math.min(words.length, start + budget);
  let end = start;
  while (low <= high) {
    const candidate = Math.floor((low + high) / 2);
    const text = words
      .slice(start, candidate)
      .map(w => w.word)
      .join(' ');
    if ((await tokenCount(tokenizer, text)) <= budget) {
      end = candidate;
      low = candidate + 1;
    } else high = candidate - 1;
  }
  if (end === start)
    throw new Error('PDF contains a word exceeding the chunk token limit');
  return end;
}

export async function chunkPdf(extraction, tokenizer) {
  const text = typeof extraction === 'string' ? extraction : extraction.text;
  const tables = layoutTables(
    typeof extraction === 'string' ? '' : extraction.layout
  );
  const blocks = [];
  let section = null;
  let subsection = null;
  let mainNumber = 0;
  let words = [];
  let warnings = new Set();
  const flush = () => {
    if (words.length)
      blocks.push({
        section,
        subsection,
        words,
        contentType: 'prose',
        extractionWarnings: [...warnings],
      });
    words = [];
    warnings = new Set();
  };
  let references = false;
  for (const [pageIndex, lines] of cleanPages(text).entries()) {
    const noise = figureNoise(lines);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (REFERENCES.test(line)) {
        references = true;
        break;
      }
      if (TABLE_CAPTION.test(line)) {
        const number = line.match(/^Table\s+(\d+)/i)?.[1];
        const table = tables.find(
          item =>
            item.page === pageIndex + 1 &&
            item.caption.match(/^Table\s+(\d+)/i)?.[1] === number
        );
        if (table) {
          flush();
          blocks.push({
            ...table,
            section,
            subsection,
            contentType: 'table',
            extractionWarnings: [
              'Layout-preserved table; merged cells and column associations are not automatically verified.',
            ],
          });
          const resume = tableResume(lines, i, table);
          if (resume.index >= lines.length) break;
          lines[resume.index] = resume.text;
          i = resume.index - 1;
          continue;
        }
      }
      if (noise.has(i)) {
        warnings.add(
          'Diagram labels omitted; consult the PDF for figure details.'
        );
        continue;
      }
      const heading = headingAt(lines, i);
      const number = heading?.number
        ? Number(heading.number.split('.')[0])
        : null;
      if (
        heading &&
        (number === null || (number >= mainNumber && number <= 30))
      ) {
        flush();
        if (heading.number?.includes('.')) {
          if (number > mainNumber) section = null;
          subsection = heading.title;
        } else {
          section = heading.title;
          subsection = null;
        }
        if (number !== null) mainNumber = number;
        i += heading.consumed - 1;
        continue;
      }
      // A formula or algorithm assignment is not a chunk boundary. Keep the
      // fragments, step numbers, and explanatory prose in the same token-sized
      // context so "Hits@Klp =" or "4" never become standalone math vectors.
      if (equationLine(line) || /[∑∏∈⊂≤≥]|\bMRR\w*\s*=/.test(line))
        warnings.add(
          'Mathematical notation or pseudocode extracted as plain text may be corrupted; verify symbols and indices in the PDF.'
        );
      while (/\p{L}-$/u.test(line) && /^\p{Ll}/u.test(lines[i + 1] || ''))
        line = line.slice(0, -1) + lines[++i];
      words.push(
        ...line
          .split(/\s+/)
          .filter(Boolean)
          .map(word => ({
            word,
            page: pageIndex + 1,
            boundary: /[.!?][)\]”"']?$/.test(word),
          }))
      );
      if (words.length && (!line || /[.!?][)\]”"']?$/.test(line)))
        words[words.length - 1].boundary = true;
    }
    if (references) break;
  }
  flush();
  const chunks = [];
  for (const block of blocks) {
    if (block.contentType !== 'prose') {
      // Tables are atomic context units; never flatten
      // them or split a metric row just to satisfy the prose size target.
      chunks.push({
        text: block.text,
        chunkIndex: chunks.length,
        pageStart: block.page,
        pageEnd: block.page,
        section: block.section,
        subsection: block.subsection,
        contentType: block.contentType,
        tableCaption: block.caption || null,
        extractionWarnings: block.extractionWarnings,
      });
      continue;
    }
    let start = 0;
    while (start < block.words.length) {
      const maximum = await wordEnd(block.words, start, TOKEN_LIMIT, tokenizer);
      let end = maximum;
      if (maximum < block.words.length) {
        // Prefer a sentence/paragraph break in the latter part of the window.
        const earliest = start + Math.floor((maximum - start) * 0.65);
        for (let j = maximum - 1; j >= earliest; j--) {
          if (block.words[j].boundary) {
            end = j + 1;
            break;
          }
        }
      }
      const selected = block.words.slice(start, end);
      chunks.push({
        text: selected.map(w => w.word).join(' '),
        chunkIndex: chunks.length,
        pageStart: selected[0].page,
        pageEnd: selected[selected.length - 1].page,
        section: block.section,
        subsection: block.subsection,
        contentType: 'prose',
        extractionWarnings: block.extractionWarnings,
      });
      if (end === block.words.length) break;
      // Token-based overlap, bounded so every iteration makes progress.
      let next = end;
      while (
        next > start + 1 &&
        (await tokenCount(
          tokenizer,
          block.words
            .slice(next - 1, end)
            .map(w => w.word)
            .join(' ')
        )) <= OVERLAP_TOKENS
      )
        next--;
      start = next;
    }
  }
  if (!chunks.length) throw new Error('No semantic chunks after PDF cleanup');
  return chunks;
}

// MiniLM's normal sentence-embedding budget is 256 word pieces. Larger context
// units (especially tables) are embedded in bounded windows, then length-weighted
// and normalized. Every word participates; no tail is silently truncated.
export async function embedPdfChunk(chunk, extractor) {
  const prefix = [chunk.section, chunk.subsection, chunk.tableCaption]
    .filter(Boolean)
    .join(' | ');
  const words = `${prefix}\n${chunk.text}`
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({ word }));
  const tokenizerLimit = Number(extractor.tokenizer.model_max_length);
  const budget = Number.isFinite(tokenizerLimit)
    ? Math.min(220, tokenizerLimit)
    : 220;
  let start = 0;
  let sum;
  while (start < words.length) {
    const end = await wordEnd(words, start, budget, extractor.tokenizer);
    const input = words
      .slice(start, end)
      .map(w => w.word)
      .join(' ');
    const tensor = await extractor(input, { pooling: 'mean', normalize: true });
    const vector = tensor.tolist()[0];
    if (!vector.length || !vector.every(Number.isFinite))
      throw new Error('Invalid PDF embedding');
    if (!sum) sum = vector.map(() => 0);
    const weight = await tokenCount(extractor.tokenizer, input);
    vector.forEach((value, i) => {
      sum[i] += value * weight;
    });
    start = end;
  }
  const norm = Math.hypot(...sum);
  if (!Number.isFinite(norm) || norm === 0)
    throw new Error('Invalid pooled PDF embedding');
  return sum.map(value => value / norm);
}
