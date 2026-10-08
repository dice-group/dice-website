import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const exec = promisify(execFile);
// Bump whenever parser settings, cleanup, chunk boundaries or overlap change.
export const PIPELINE_VERSION = 1;
const TOKEN_LIMIT = 220;
const OVERLAP_WORDS = 20;
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
    return stdout;
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

export async function chunkPdf(text, tokenizer) {
  const sections = [];
  let section = null;
  let subsection = null;
  let words = [];
  const flush = () => {
    if (words.length) sections.push({ section, subsection, words });
    words = [];
  };
  let references = false;
  for (const [pageIndex, lines] of cleanPages(text).entries()) {
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (REFERENCES.test(line)) {
        references = true;
        break;
      }
      const heading = line.match(
        /^(\d+(?:\.\d+)*)[.)]?\s+([A-Z][^.!?]{2,90})$/
      );
      const named = /^(abstract|introduction|conclusions?|acknowledg[e]?ments?)$/i.test(
        line
      );
      if (heading || named) {
        flush();
        if (heading?.[1].includes('.')) subsection = line;
        else {
          section = line;
          subsection = null;
        }
      }
      // Repair a word broken at a line boundary without joining paragraphs.
      while (/\p{L}-$/u.test(line) && /^\p{Ll}/u.test(lines[i + 1] || ''))
        line = line.slice(0, -1) + lines[++i];
      words.push(
        ...line
          .split(/\s+/)
          .filter(Boolean)
          .map(word => ({ word, page: pageIndex + 1 }))
      );
    }
    if (references) break;
  }
  flush();
  const chunks = [];
  for (const block of sections) {
    let start = 0;
    while (start < block.words.length) {
      // Count actual model tokens, including special tokens, to avoid truncation.
      let low = start + 1;
      let high = Math.min(block.words.length, start + TOKEN_LIMIT);
      let end = start;
      while (low <= high) {
        const candidate = Math.floor((low + high) / 2);
        const input = block.words
          .slice(start, candidate)
          .map(w => w.word)
          .join(' ');
        const encoded = await tokenizer(input, {
          truncation: false,
          padding: false,
        });
        if (encoded.input_ids.data.length <= TOKEN_LIMIT) {
          end = candidate;
          low = candidate + 1;
        } else high = candidate - 1;
      }
      if (end === start)
        throw new Error('PDF contains a word exceeding the chunk token limit');
      const selected = block.words.slice(start, end);
      chunks.push({
        text: selected.map(w => w.word).join(' '),
        chunkIndex: chunks.length,
        pageStart: selected[0].page,
        pageEnd: selected[selected.length - 1].page,
        section: block.section,
        subsection: block.subsection,
      });
      if (end === block.words.length) break;
      start = Math.max(start + 1, end - OVERLAP_WORDS);
    }
  }
  if (!chunks.length) throw new Error('No semantic chunks after PDF cleanup');
  return chunks;
}
