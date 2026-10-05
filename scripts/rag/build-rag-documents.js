const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Parser } = require('n3');

const INPUT_DIR = process.argv[2] || './data';
const OUTPUT_FILE = process.argv[3] || './rag_documents.jsonl';

const EXCLUDED_DIRS = new Set(['papers_all', 'rag']);

const TYPE_CONFIG = {
  person: {
    folders: ["people"],
    typeLabel: "Person",
    fields: [
      ["Name", ["name"]],
      ["Role", ["role"]],
      ["Projects", ["project"]],
    ],
  },

  paper: {
    folders: ['papers'],
    typeLabel: 'Publication',
    fields: [
      ["Title", ["title", "name"]],
      ['Authors', ['http://schema.org/authorName']],
      ['Publication type', ['http://schema.org/publicationType']],
      ['Published in', ['http://schema.org/source']],
      ['Year', ['http://schema.org/year']],
      ['Keywords', ['http://schema.org/tag']],
      ['Abstract', ['http://schema.org/abstract', 'http://schema.org/content']],
    ],
  },

  project: {
    folders: ["projects"],
    typeLabel: "Project",
    fields: [
      ["Name", ["name"]],
      ["Tagline", ["tagline"]],
      ["Description", ["content"]],
      ["Status", ["status"]],
      ["Start date", ["startDate"]],
      ["End date", ["endDate"]],
      ["Maintainers", ["maintainer"]],
      ["Publication tags", ["publicationTag"]],
    ],
  },

  group: {
    folders: ['groups'],
    typeLabel: 'Research Group',
    fields: [
      ['Name', ['http://schema.org/name']],
      ['Tagline', ['http://schema.org/tagline']],
      [
        'Description',
        ['http://schema.org/content', 'http://schema.org/description'],
      ],
      ['Members', ['http://schema.org/member']],
      ['Related projects', ['http://schema.org/relatedProject']],
      ['Related demos', ['http://schema.org/relatedDemo']],
    ],
  },

  demo: {
    folders: ['demos'],
    typeLabel: 'Demo',
    fields: [
      ['Name', ['http://schema.org/name']],
      ['Tagline', ['http://schema.org/tagline']],
      [
        'Description',
        ['http://schema.org/content', 'http://schema.org/description'],
      ],
      ['Maintainers', ['http://schema.org/maintainer']],
      ['Developers', ['http://schema.org/developer']],
      ['Keywords', ['http://schema.org/tag']],
    ],
  },

  partner: {
    folders: ['partners'],
    typeLabel: 'Partner',
    fields: [
      ['Name', ['http://schema.org/name']],
      ['Country', ['http://schema.org/addressCountry']],
      ['Description', ['http://schema.org/description']],
    ],
  },

  funder: {
    folders: ['funding', 'funders'],
    typeLabel: 'Funder',
    fields: [
      ['Name', ['http://schema.org/name']],
      ['Alternative names', ['http://schema.org/alternateName']],
      ['Description', ['http://schema.org/description']],
    ],
  },

  award: {
  folders: ["awards"],
  typeLabel: "Award",
  fields: [
      ["Name", ["name"]],
      ["Year", ["year"]],
      ["Description", ["content", "description"]],
      ["Awardees", ["awardee", "awardeeExternal"]],
    ],
  },
};

function walk(dir) {
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ttl')) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseTurtle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parser = new Parser();
  return parser.parse(content);
}

function stripHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanLiteral(value) {
  return stripHtml(value).trim();
}

function localName(uri) {
  const parts = uri.split(/[\/#]/);
  return decodeURIComponent(parts[parts.length - 1] || uri)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function detectKind(filePath) {
  const relative = path.relative(INPUT_DIR, filePath);
  const folder = relative.split(path.sep)[0];

  for (const [kind, config] of Object.entries(TYPE_CONFIG)) {
    if (config.folders.includes(folder)) {
      return kind;
    }
  }

  return null;
}

function groupBySubject(quads) {
  const subjects = new Map();

  for (const quad of quads) {
    const subject = quad.subject.value;

    if (!subjects.has(subject)) {
      subjects.set(subject, []);
    }

    subjects.get(subject).push(quad);
  }

  return subjects;
}

function findMainSubject(subjectMap) {
  let best = null;
  let bestScore = -1;

  for (const [subject, quads] of subjectMap.entries()) {
    if (subject.startsWith('_:')) continue;

    let score = quads.length;

    if (
      quads.some(
        q =>
          q.predicate.value === 'http://schema.org/name' ||
          q.predicate.value === 'http://schema.org/title'
      )
    ) {
      score += 100;
    }

    if (score > bestScore) {
      bestScore = score;
      best = subject;
    }
  }

  return best;
}

function predicateLocalName(uri) {
  const parts = uri.split(/[\/#]/);
  return parts[parts.length - 1];
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function valuesForPredicates(quads, predicates) {
  return quads
    .filter((q) =>
      predicates.includes(predicateLocalName(q.predicate.value))
    )
    .map((q) => q.object);
}

function getPreferredLabel(quads) {
  const preferredPredicates = [
    "name",
    "title",
    "label",
  ];

  for (const predicate of preferredPredicates) {
    const obj = quads.find(
      (q) =>
        predicateLocalName(q.predicate.value) === predicate
    )?.object;

    if (obj) {
      return cleanLiteral(obj.value);
    }
  }

  return null;
}

function buildLabelIndex(files) {
  const labels = new Map();

  for (const file of files) {
    try {
      const quads = parseTurtle(file);
      const grouped = groupBySubject(quads);

      for (const [subject, subjectQuads] of grouped.entries()) {
        const label = getPreferredLabel(subjectQuads);

        if (label) {
          labels.set(subject, label);
        }
      }
    } catch (error) {
      console.error(`Label indexing failed for ${file}: ${error.message}`);
    }
  }

  return labels;
}

function resolveObject(term, labelIndex) {
  if (term.termType === 'Literal') {
    return cleanLiteral(term.value);
  }

  if (term.termType === 'NamedNode') {
    return labelIndex.get(term.value) || localName(term.value);
  }

  return term.value;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function makeText(kind, quads, labelIndex) {
  const config = TYPE_CONFIG[kind];
  const lines = [`Type: ${config.typeLabel}`];

  for (const [label, predicates] of config.fields) {
    const objects = valuesForPredicates(quads, predicates);

    const values = unique(objects.map(obj => resolveObject(obj, labelIndex)));

    if (!values.length) continue;

    let rendered;

    if (label === 'Description' || label === 'Abstract') {
      rendered = values.join('\n\n');
    } else {
      rendered = values.join(', ');
    }

    lines.push(`${label}: ${rendered}`);
  }

  return lines.join('\n').trim();
}

function contentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function buildDocument(filePath, labelIndex) {
  const kind = detectKind(filePath);
  if (!kind) return null;

  const quads = parseTurtle(filePath);
  const grouped = groupBySubject(quads);

  const mainSubject = findMainSubject(grouped);
  if (!mainSubject) return null;

  const subjectQuads = grouped.get(mainSubject);
  const name =
    getPreferredLabel(subjectQuads) ||
    labelIndex.get(mainSubject) ||
    localName(mainSubject);

  const text = makeText(kind, subjectQuads, labelIndex);

  if (!text || text.length < 10) {
    return null;
  }

  return {
    id: mainSubject,
    text,
    metadata: {
      uri: mainSubject,
      kind,
      name,
      source: path.relative(INPUT_DIR, filePath),
      contentHash: contentHash(text),
    },
  };
}

function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`Input directory does not exist: ${INPUT_DIR}`);
    process.exit(1);
  }

  const files = walk(INPUT_DIR);

  console.log(`Found ${files.length} TTL files`);
  console.log('Building label index...');

  const labelIndex = buildLabelIndex(files);

  console.log(`Indexed ${labelIndex.size} labels`);
  console.log('Building RAG documents...');

  const documents = [];
  const seenUris = new Set();
  const seenPaperTitles = new Set();
  const counts = {};
  let errors = 0;

  for (const file of files) {
    try {
      const doc = buildDocument(file, labelIndex);

      if (!doc) continue;

      if (doc.metadata.kind === "paper") {
        const titleKey = normalizeText(doc.metadata.name);

        if (seenPaperTitles.has(titleKey)) {
          console.warn(
            `Duplicate paper title skipped: ${doc.metadata.name}`
          );
          continue;
        }

        seenPaperTitles.add(titleKey);
      }

      if (seenUris.has(doc.metadata.uri)) {
        console.warn(`Duplicate URI skipped: ${doc.metadata.uri}`);
        continue;
      }

      seenUris.add(doc.metadata.uri);

      documents.push(doc);

      counts[doc.metadata.kind] = (counts[doc.metadata.kind] || 0) + 1;
    } catch (error) {
      errors += 1;
      console.error(`Failed: ${file}`);
      console.error(error.message);
    }
  }

  const output = documents.map(doc => JSON.stringify(doc)).join('\n');

  fs.writeFileSync(
    OUTPUT_FILE,
    output + (documents.length ? '\n' : ''),
    'utf8'
  );

  console.log('');
  console.log(`Written: ${OUTPUT_FILE}`);
  console.log(`Documents: ${documents.length}`);
  console.log(`Errors: ${errors}`);
  console.log('Counts:');

  for (const [kind, count] of Object.entries(counts).sort()) {
    console.log(`  ${kind}: ${count}`);
  }
}

main();
