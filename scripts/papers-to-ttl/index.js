const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const fetch = require('isomorphic-unfetch');
const {
  Writer,
  DataFactory: { namedNode, literal, quad },
} = require('n3');
const BIBSONOMY_BASE =
  process.env.BIBSONOMY_BASE || 'https://www.bibsonomy.org';
const BIBSONOMY_USER = process.env.BIBSONOMY_USER;
const BIBSONOMY_API_TOKEN = process.env.BIBSONOMY_API_TOKEN;

// path to folder with papers
// uses ./data/papers from project root
const folder = path.join(__dirname, '..', '..', 'data', 'papers');

// common prefixes that we use
const prefixes = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dice: 'https://dice-research.org/',
  dicepapers: 'https://dice-research.org/papers/',
  schema: 'https://schema.dice-research.org/',
};

// writer config that outputs turtle with our prefixes
const writerConfig = {
  format: 'Turtle',
  prefixes,
};

/**
 * Creates new function with given writer and URL
 * that will add predicate and object as named node
 *
 * @param {Object} writer N3 writer instance
 * @param {any} paperUrl URL of the subject
 */
const createUrlWriter = (writer, paperUrl) => (predicate, obj) => {
  // only write triples with non-null objects
  if (!obj || !obj.length) {
    return;
  }
  writer.addQuad(
    quad(namedNode(paperUrl), namedNode(predicate), namedNode(obj.trim()))
  );
};

/**
 * Creates new function with given writer and URL
 * that will add predicate and object as literal
 *
 * @param {Object} writer N3 writer instance
 * @param {any} paperUrl URL of the subject
 */
const createLiteralWriter = (writer, paperUrl) => (predicate, obj) => {
  // only write triples with non-null objects
  if (!obj || !obj.length) {
    return;
  }
  writer.addQuad(
    quad(
      namedNode(paperUrl),
      namedNode(`${prefixes.schema}${predicate}`),
      literal(obj)
    )
  );
};

function bibAuthHeaders() {
  const headers = { Accept: 'application/json' };
  if (BIBSONOMY_API_TOKEN) {
    headers.Authorization =
      'Basic ' +
      Buffer.from(`${BIBSONOMY_USER}:${BIBSONOMY_API_TOKEN}`).toString(
        'base64'
      );
  }
  return headers;
}

/**
 * Function for checking whether a given string is a valid URL. The regex is copied from
 * https://stackoverflow.com/questions/17726427/check-if-url-is-valid-or-not .
 */
function checkUrl(url) {
  var regexp = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?$/;
  return regexp.test(url);
}

/**
 * Extract a raw URL from possible Markdown like: [text](https://example)
 */
function extractUrl(s) {
  if (!s) return '';
  const str = String(s);
  const m = str.match(/\((https?:\/\/[^)]+)\)/); // [text](URL)
  if (m) return m[1];
  const bare = str.match(/https?:\/\/[^\s)>]+/); // fallback: first http(s)://...
  return bare ? bare[0] : str;
}

// Normalize a URL:
//  - remove backslashes used as escapes (\_ \%)
//  - collapse accidental multiple slashes is path (keep scheme //)
//  - trim
function normalizeUrl(s) {
  if (!s) return '';
  let url = extractUrl(String(s).trim());
  url = url.replace(/^<+|>+$/g, '');
  url = url.replace(/\\/g, '');
  const m = url.match(/^(https?:\/\/[^/]+)(\/.*)?$/i);
  if (m) {
    const host = m[1];
    const path = (m[2] || '').replace(/\/{2,}/g, '/');
    url = host + path;
  }
  return url;
}

// Keep legacy behavior for PDF URLs but reuse the generic normalizer.
function preprocessPdfUrl(url) {
  return normalizeUrl(url);
}

/**
 * Main logic execution (because we still don't have top level async)
 */
const main = async () => {
  // get papers for tag `simba`
  const {
    items: papers,
  } = await fetch(
    `${BIBSONOMY_BASE}/api/user/${encodeURIComponent(
      BIBSONOMY_USER
    )}/simba?items=1000`,
    { headers: bibAuthHeaders() }
  ).then(r => r.json());

  // load papers with "dice" tag and add them to result dataset
  const papersDice = await fetch(
    `${BIBSONOMY_BASE}/api/user/${encodeURIComponent(
      BIBSONOMY_USER
    )}/dice?items=1000`,
    { headers: bibAuthHeaders() }
  ).then(r => r.json());
  console.log('dice keys', Object.keys(papersDice));
  console.log(
    'Dice items?',
    papersDice.items && Array.isArray(papersDice.items),
    'type:',
    typeof papersDice.items
  );
  console.log('dice snippet:', JSON.stringify(papersDice).slice(0, 800));

  // merge papers into one array
  papersDice.items.forEach(paper => {
    // ignore papers that are already added
    if (papers.find(p => p.id === paper.id)) {
      return;
    }

    papers.push(paper);
  });

  console.log('Processing papers:', papers.length);

  // process papers one by one
  papers.forEach(paper => {
    // create new turtle writer for paper
    const writer = new Writer(writerConfig);

    // generate a basename for file and URL
    const baseName = _.upperFirst(_.camelCase(paper.label));
    const baseFileName = paper.id.replace(
      /https:\/\/www.bibsonomy.org\/bibtex\/(.+?)\/(.+)/,
      '$1_$2'
    );

    // generate URL for paper
    const paperUrl = `${prefixes.dicepapers}${baseName}`;

    // create writer functions
    const writeUrl = createUrlWriter(writer, paperUrl);
    const writeLiteral = createLiteralWriter(writer, paperUrl);

    // write rdf:type info
    writeUrl(`${prefixes.rdf}type`, `${prefixes.schema}Publication`);

    // write base info
    writeLiteral('type', paper.type);
    writeLiteral('title', paper.label);
    writeLiteral('publicationType', paper['pub-type']);
    writeLiteral('year', paper.year);
    if (paper.booktitle || paper.journal) {
      writeLiteral('source', paper.booktitle || paper.journal);
    }
    if (paper.tags && paper.tags.length > 0) {
      paper.tags.forEach(tag => {
        writeLiteral('tag', tag);
      });
    }

    // sanitize and add the canonical URL
    const cleanUrl = normalizeUrl(paper.url);
    if (checkUrl(cleanUrl)) {
      writeUrl(`${prefixes.schema}url`, cleanUrl);
    } else if (paper.doi) {
      const doiUrl = normalizeUrl(
        `https://doi.org/${String(paper.doi).replace(
          /^https?:\/\/(dx\.)?doi\.org\//i,
          ''
        )}`
      );
      if (checkUrl(doiUrl)) {
        writeUrl(`${prefixes.schema}url`, doiUrl);
      }
    }

    if (paper.doi) {
      writeLiteral(
        'doi',
        String(paper.doi)
          .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
          .trim()
      );
    }

    writeUrl(`${prefixes.schema}bibsonomyId`, paper.id);
    var pdfUrl = preprocessPdfUrl(paper['bdsk-url-1'] || paper['1']);
    if (checkUrl(pdfUrl)) {
      writeUrl(`${prefixes.schema}pdfUrl`, pdfUrl);
    }

    const presentationUrl = normalizeUrl(
      paper.presentation || paper.slides || paper.presentationurl
    );
    if (checkUrl(presentationUrl)) {
      writeUrl(`${prefixes.schema}presentationUrl`, presentationUrl);
    }

    const videoUrl = normalizeUrl(
      paper.video || paper.recording || paper.videourl
    );
    if (checkUrl(videoUrl)) {
      writeUrl(`${prefixes.schema}videoUrl`, videoUrl);
    }

    if (paper.authors && paper.authors.length > 0) {
      // write URLs that link to our website
      paper.authors.forEach(author => {
        const name = _.upperFirst(_.camelCase(author.first + author.last));
        writeUrl(`${prefixes.schema}author`, `${prefixes.dice}${name}`);
      });
      // write plaintext names
      paper.authors.forEach(({ first, last }) => {
        writeLiteral('authorName', `${first} ${last}`);
      });
    }

    // save paper to the file
    writer.end((error, result) => {
      if (error) {
        throw error;
      }
      // generate filename
      const filename = `${baseFileName}.ttl`;
      const filepath = path.join(folder, filename);
      // write result
      fs.writeFile(filepath, result, err => {
        if (err) {
          throw err;
        }
      });
    });
  });
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
