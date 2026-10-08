import { readFileSync } from 'node:fs';
import { env, pipeline } from '@huggingface/transformers';
import { QdrantClient } from '@qdrant/js-client-rest';
import { askLlm } from './ask-rag.mjs';
import { EMBEDDING_MODEL, EMBEDDING_OPTIONS } from './embedding-config.mjs';

const MODEL = EMBEDDING_MODEL;

if (process.env.RAG_MODEL_CACHE) {
  env.cacheDir = process.env.RAG_MODEL_CACHE;
}

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';

const COLLECTION = process.env.QDRANT_COLLECTION || 'dice_rag';

const ENTITY_STORE_PATH =
  process.env.RAG_ENTITY_STORE ||
  new URL('../../data/rag/entities.json', import.meta.url);
let entityStore;
try {
  entityStore = JSON.parse(readFileSync(ENTITY_STORE_PATH, 'utf8'));
} catch (error) {
  throw new Error(
    'Cannot load RAG entity store. Run npm run rag:entities or set RAG_ENTITY_STORE.',
    { cause: error }
  );
}

function getRdfEntity(id) {
  const entity = entityStore[id];
  if (!entity)
    throw new Error(
      `RAG entity missing from store: ${id}. Regenerate the entity store and index together.`
    );
  return entity;
}

function getAllProjects() {
  return Object.values(entityStore)
    .filter(entity => Array.isArray(entity.staff))
    .map(entity => entity.data.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

const CATEGORY_PATHS = {
  group: '/groups/',
  demo: '/demos/',
  partner: '/partners/',
};

const CATEGORY_NAMES = {
  group: 'Research Groups',
  demo: 'Demos',
  partner: 'Partners',
};

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

const QUERY_STOP_WORDS = new Set([
  'who',
  'what',
  'where',
  'when',
  'why',
  'how',
  'is',
  'are',
  'was',
  'were',
  'do',
  'does',
  'did',
  'the',
  'a',
  'an',
  'of',
  'for',
  'with',
  'in',
  'on',
  'at',
  'about',
  'tell',
  'me',
]);

// Category words identify the kind of entity, not its name.
const ENTITY_KIND_WORDS = new Set([
  'demo',
  'demos',
  'demonstration',
  'demonstrations',
  'project',
  'projects',
  'paper',
  'papers',
  'publication',
  'publications',
  'group',
  'groups',
  'person',
  'people',
  'researcher',
  'researchers',
  'partner',
  'partners',
  'funder',
  'funders',
  'award',
  'awards',
]);

const GLOBAL_SEMANTIC_LIMIT = 20;
const GLOBAL_FINAL_LIMIT = 6;
const MAX_GLOBAL_CHUNKS_PER_PAPER = 3;
const PAPER_SEMANTIC_LIMIT = 10;
const PAPER_CONTEXT_LIMIT = 5;
const LEXICAL_WEIGHT = 0.2;
const PAPER_CONTENT_TERMS = new Set([
  'dataset',
  'datasets',
  'method',
  'methods',
  'approach',
  'approaches',
  'experiment',
  'experiments',
  'result',
  'results',
  'evaluation',
  'baseline',
  'baselines',
  'limitation',
  'limitations',
  'conclusion',
  'conclusions',
  'how',
  'why',
  'performance',
  'benchmark',
  'benchmarks',
  'algorithm',
  'algorithms',
  'architecture',
  'training',
  'accuracy',
  'mrr',
]);

const QUERY_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'about',
  'does',
  'do',
  'for',
  'from',
  'how',
  'in',
  'is',
  'of',
  'on',
  'the',
  'to',
  'used',
  'use',
  'uses',
  'what',
  'which',
  'who',
  'with',
  'dice',
  'paper',
  'papers',
]);

function normalizeLexical(value = '') {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lexicalTerms(query) {
  return normalizeLexical(query)
    .split(' ')
    .filter(token => token.length >= 3 && !QUERY_STOPWORDS.has(token));
}

function lexicalScore(query, payload = {}) {
  const terms = lexicalTerms(query);
  if (!terms.length) return 0;
  const haystack = normalizeLexical(
    [payload.title, payload.section, payload.subsection, payload.text]
      .filter(Boolean)
      .join(' ')
  );
  const hits = terms.filter(term => haystack.includes(term)).length;
  const coverage = hits / terms.length;
  const phraseBonus =
    terms.length > 1 && haystack.includes(terms.join(' ')) ? 0.5 : 0;
  return Math.min(coverage + phraseBonus, 1.5);
}

function rerankGlobalHits(hits, query) {
  return hits
    .map(hit => {
      const vectorScore = hit.score ?? 0;
      const lexScore = lexicalScore(query, hit.payload ?? {});
      return {
        ...hit,
        vectorScore,
        lexicalScore: lexScore,
        hybridScore: vectorScore + LEXICAL_WEIGHT * lexScore,
      };
    })
    .sort((a, b) => b.hybridScore - a.hybridScore);
}

function recognizePaper(question) {
  // Comparisons and discovery across publications must retain global scope.
  if (/\b(papers|publications|compare|comparison|versus|vs)\b/i.test(question))
    return null;
  const query = ` ${normalize(question)} `;
  const matches = Object.values(entityStore).filter(entity => {
    if (entity.kind !== 'paper') return false;
    const title = String(entity.data.title || entity.data.name || '');
    const normalized = normalize(title);
    if (normalized.split(' ').length >= 3 && query.includes(` ${normalized} `))
      return true;
    // Recognize a distinctive named title prefix, e.g. "ASTRA: Adaptive ...".
    // Do not infer identity from generic words anywhere in a title.
    const prefix = title.match(
      /^\s*([\p{L}\p{N}][\p{L}\p{N}-]{2,29})\s*:/u
    )?.[1];
    if (
      !prefix ||
      QUERY_STOP_WORDS.has(normalize(prefix)) ||
      ENTITY_KIND_WORDS.has(normalize(prefix))
    )
      return false;
    if ((prefix.match(/[A-Z]/g) || []).length < 2) return false;
    return query.includes(` ${normalize(prefix)} `);
  });
  // Ambiguous acronyms and questions naming multiple papers stay global.
  return matches.length === 1 ? matches[0] : null;
}

function limitGlobalChunksPerPaper(
  hits,
  maxPerPaper = MAX_GLOBAL_CHUNKS_PER_PAPER
) {
  const counts = new Map();
  return hits.filter(hit => {
    const payload = hit.payload ?? {};
    if (payload.kind === 'paper_chunk' && payload.paperUri) {
      const count = counts.get(payload.paperUri) ?? 0;
      if (count >= maxPerPaper) return false;
      counts.set(payload.paperUri, count + 1);
    }
    return true;
  });
}

function selectContext(candidates, scoped) {
  const selected = [];
  const seen = new Set();
  for (const hit of candidates) {
    const p = hit.payload;
    const parent = p.paperUri || p.uri;
    const isChunk = p.kind === 'paper_chunk';
    // Deduplicate identical excerpts across generations as well as point IDs.
    const key = isChunk
      ? JSON.stringify([parent, normalize(p.text)])
      : JSON.stringify([p.kind, parent]);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(hit);
  }
  // Cap after deduplication, before taking the final slots, so lower-ranked
  // evidence from other papers can fill slots vacated by excess chunks.
  return scoped
    ? selected.slice(0, PAPER_CONTEXT_LIMIT)
    : limitGlobalChunksPerPaper(selected).slice(0, GLOBAL_FINAL_LIMIT);
}

function compact(values) {
  return Array.isArray(values)
    ? values.filter(Boolean)
    : values
    ? [values]
    : [];
}

function names(items) {
  return compact(items)
    .map(item => item?.data?.name || item?.id)
    .filter(Boolean);
}

function detectRequestedKind(query) {
  const q = query.toLowerCase();
  if (/\b(authored|authors?|wrote|written by)\b/.test(q)) return 'paper';

  // If a group is explicitly mentioned, retrieve the group,
  // even for questions such as "who leads...".
  if (/\b(group|groups|research group)\b/.test(q)) {
    return 'group';
  }

  // "Demo projects" means demos on the website.
  if (/\b(demo|demos|demonstration|demonstrations)\b/.test(q)) {
    return 'demo';
  }

  // "What projects does PERSON work on?"
  // should retrieve the person, not project entities.
  if (
    /\bprojects?\b/.test(q) &&
    /\b(associated with|works? on|working on|involved in)\b/.test(q)
  ) {
    return 'person';
  }

  if (/\b(project|projects)\b/.test(q)) {
    return 'project';
  }

  if (/\b(paper|papers|publication|publications)\b/.test(q)) {
    return 'paper';
  }

  if (/\b(award|awards)\b/.test(q)) {
    return 'award';
  }

  if (/\b(partner|partners)\b/.test(q)) {
    return 'partner';
  }

  if (/\b(funder|funders|funding body)\b/.test(q)) {
    return 'funder';
  }

  if (
    /\bwho\b/.test(q) ||
    /\b(person|people|researcher|researchers|staff|member|members)\b/.test(q)
  ) {
    return 'person';
  }

  return null;
}

function isBroadCategoryQuery(question, kind) {
  if (!['group', 'demo', 'partner'].includes(kind)) {
    return false;
  }

  const q = question.toLowerCase().trim();

  return (
    /\b(list|show)\s+(?:me\s+)?(?:all\s+)?/.test(q) ||
    /\ball\s+(?:our\s+)?(groups?|demos?|partners?)\b/.test(q) ||
    /\b(groups?|demos?|partners?)\s+(?:do|does)\s+we\s+have\b/.test(q) ||
    /\b(groups?|demos?|partners?)\s+are\s+(?:there|available)\b/.test(q) ||
    /\bwhat\s+(?:groups?|demos?|partners?)\s+do\s+we\s+have\b/.test(q) ||
    /\bwhich\s+(?:groups?|demos?|partners?)\s+do\s+we\s+have\b/.test(q)
  );
}

function activeNames(items) {
  return compact(items)
    .filter(item => {
      const roles = compact(item?.data?.role);

      return !roles.some(role => {
        const roleId = String(role?.id || '').toLowerCase();

        const roleName = String(role?.data?.name || '').toLowerCase();

        return roleId.endsWith('/alumni') || roleName === 'alumni';
      });
    })
    .map(item => item?.data?.name || item?.id)
    .filter(Boolean);
}

function cleanContent(value) {
  if (!value) return '';

  return value
    .replace(/<table[\s\S]*?<\/table>/gi, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max = 2000) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max)}...`;
}

function buildContext(hit, entity, staff = [], headProjects = []) {
  if (hit.payload.kind === 'paper_chunk') {
    const p = hit.payload;
    return [
      `URI: ${p.paperUri}`,
      'Type: Paper content excerpt',
      `Title: ${p.title}`,
      `PDF: ${p.pdfUrl}`,
      `Pages: ${p.pageStart}-${p.pageEnd}`,
      p.section && `Section: ${p.section}`,
      p.subsection && `Subsection: ${p.subsection}`,
      p.contentType && `Content type: ${p.contentType}`,
      ...(p.extractionWarnings || []).map(
        warning => `Extraction limitation: ${warning}`
      ),
      `Excerpt: ${p.text}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (!entity) {
    return [
      `URI: ${hit.payload.uri}`,
      `Type: ${hit.payload.kind}`,
      `Name: ${hit.payload.name || hit.payload.uri}`,
    ].join('\n');
  }

  const d = entity.data || {};

  const lines = [
    `URI: ${entity.id}`,
    `Path: ${entity.path}`,
    `Type: ${hit.payload.kind}`,
  ];

  const leads = names(d.lead);

  if (leads.length) {
    lines.push(`Lead: ${leads.join(', ')}`);
  }

  if (d.name) {
    lines.push(`Name: ${d.name}`);
  }

  if (d.tagline) {
    lines.push(`Tagline: ${d.tagline}`);
  }

  const descriptions = [...compact(d.content), ...compact(d.contenthtml)];
  if (descriptions.length) {
    const description = truncate(cleanContent(descriptions.join('\n')));

    lines.push(`Description: ${description}`);
  }

  if (d.status) {
    lines.push(`Status: ${d.status}`);
  }

  if (d.startDate) {
    lines.push(`Start date: ${d.startDate}`);
  }

  if (d.endDate) {
    lines.push(`End date: ${d.endDate}`);
  }

  if (d.year) {
    lines.push(`Year: ${d.year}`);
  }

  if (d.title) {
    lines.push(`Title: ${d.title}`);
  }

  if (d.publicationType) {
    lines.push(`Publication type: ${d.publicationType}`);
  }

  if (d.source) {
    lines.push(`Source: ${d.source}`);
  }

  if (d.publicationTag) {
    lines.push(`Publication tag: ${d.publicationTag}`);
  }

  if (d.tag?.length) {
    lines.push(`Tags: ${d.tag.join(', ')}`);
  }

  const maintainers = names(d.maintainer);

  if (maintainers.length) {
    lines.push(`Maintainers: ${maintainers.join(', ')}`);
  }

  const developers = names(d.developer);
  if (developers.length) {
    lines.push(`Developers: ${developers.join(', ')}`);
  }

  const staffNames = staff
    .map(person => person?.data?.name || person?.id)
    .filter(Boolean);

  if (staffNames.length) {
    lines.push(`Staff: ${staffNames.join(', ')}`);
  }

  const partners = names(d.partner);

  if (partners.length) {
    lines.push(`Partners: ${partners.join(', ')}`);
  }

  const funders = names(d.funder);

  if (funders.length) {
    lines.push(`Funders: ${funders.join(', ')}`);
  }

  const roles = names(d.role);

  if (roles.length) {
    lines.push(`Role: ${roles.join(', ')}`);
  }

  if (headProjects.length) {
    lines.push(
      'Head association: As Head of DICE Research, this person is associated with all DICE projects.'
    );

    lines.push(`All DICE projects: ${headProjects.join(', ')}`);
  }

  const projects = names(d.project);

  if (projects.length) {
    lines.push(`Projects: ${projects.join(', ')}`);
  }

  const members = activeNames(d.member);

  if (members.length) {
    lines.push(`Members: ${members.join(', ')}`);
  }

  const relatedProjects = names(d.relatedProject);

  if (relatedProjects.length) {
    lines.push(`Related projects: ${relatedProjects.join(', ')}`);
  }

  const authors = [...names(d.author), ...compact(d.authorName)];

  if (authors.length) {
    lines.push(`Authors: ${authors.join(', ')}`);
  }

  const awardees = [...names(d.awardee), ...compact(d.awardeeExternal)];

  if (awardees.length) {
    lines.push(`Awardees: ${awardees.join(', ')}`);
  }

  return lines.join('\n');
}

const extractor = await pipeline(
  'feature-extraction',
  MODEL,
  EMBEDDING_OPTIONS
);

const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

async function runBroadCategoryQuery(question, kind) {
  const response = await qdrant.scroll(COLLECTION, {
    limit: 1000,
    with_payload: true,
    with_vector: false,
    filter: {
      must: [
        {
          key: 'kind',
          match: {
            value: kind,
          },
        },
      ],
    },
  });

  const items = response.points
    .map(point => ({
      name: point.payload?.name || point.payload?.uri || 'Unknown',
      uri: point.payload?.uri || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const itemNames = items.map(item => item.name);

  const context = [
    'SOURCE 1',
    `Category: ${CATEGORY_NAMES[kind] || kind}`,
    `Total items: ${itemNames.length}`,
    'Items:',
    ...itemNames.map(name => `- ${name}`),
  ].join('\n');

  const llmResult = await askLlm(question, context);

  const path = CATEGORY_PATHS[kind];

  return {
    question,
    answer: llmResult.answer,
    sources: [
      {
        uri: `https://dice-research.org${path}`,
        kind,
        name: CATEGORY_NAMES[kind] || kind,
        path,
        score: null,
      },
    ],
  };
}

function mergePageRanges(chunks) {
  const intervals = chunks
    .map(chunk => ({
      start: Number(chunk.pageStart),
      end: Number(chunk.pageEnd),
    }))
    .filter(
      ({ start, end }) =>
        Number.isSafeInteger(start) &&
        Number.isSafeInteger(end) &&
        start > 0 &&
        end >= start
    )
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const merged = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end + 1) {
      last.end = Math.max(last.end, interval.end);
    } else merged.push({ ...interval });
  }
  return merged;
}

function groupSourcesByPaper(sources) {
  const groups = new Map();
  for (const source of sources) {
    const isPaper = ['paper', 'paper_chunk'].includes(source.kind);
    const paperUri =
      source.paperUri || (source.kind === 'paper' ? source.uri : null);
    if (!isPaper || !paperUri) {
      groups.set(`entity:${source.kind}:${source.uri}`, source);
      continue;
    }
    const key = `paper:${paperUri}`;
    if (!groups.has(key)) {
      groups.set(key, {
        kind: 'paper',
        uri: paperUri,
        paperUri,
        title: source.paper?.title || source.name,
        name: source.name,
        path: source.path,
        paper: source.paper,
        pdfUrl: source.pdfUrl || source.paper?.pdfUrl,
        score: source.score,
        chunks: [],
        sourceNumbers: [],
      });
    }
    const group = groups.get(key);
    group.sourceNumbers.push(source.sourceNumber);
    if (source.kind === 'paper_chunk') {
      group.chunks.push(source);
      // Use the URL attached to the cited PDF evidence, including url fallback.
      group.pdfUrl = source.pdfUrl || group.pdfUrl;
    }
  }
  return [...groups.values()].map(source => {
    if (source.kind !== 'paper' || !source.chunks) return source;
    const pageRanges = mergePageRanges(source.chunks);
    return {
      ...source,
      pageRanges,
      pages: pageRanges
        .map(({ start, end }) =>
          start === end ? `${start}` : `${start}–${end}`
        )
        .join(', '),
      sections: [
        ...new Set(
          source.chunks
            .flatMap(chunk => [chunk.section, chunk.subsection])
            .filter(Boolean)
        ),
      ],
    };
  });
}

export async function runRag(question) {
  const paper = recognizePaper(question);
  const kind = paper ? 'paper' : detectRequestedKind(question);
  const asksForPaperMetadata = /\b(authored|authors?|wrote|written by|published|publication year)\b/i.test(
    question
  );
  const hasContentQuestion = normalizeLexical(question)
    .split(' ')
    .some(term => PAPER_CONTENT_TERMS.has(term));
  const metadataOnly = asksForPaperMetadata && !hasContentQuestion;

  if (kind && isBroadCategoryQuery(question, kind)) {
    return runBroadCategoryQuery(question, kind);
  }

  const tensor = await extractor(question, {
    pooling: 'mean',
    normalize: true,
  });

  const queryVector = tensor.tolist()[0];

  const filter = paper
    ? {
        must: [
          {
            key: 'kind',
            match: { value: metadataOnly ? 'paper' : 'paper_chunk' },
          },
          {
            key: metadataOnly ? 'uri' : 'paperUri',
            match: { value: paper.id },
          },
        ],
      }
    : kind
    ? {
        must: [
          {
            key: 'kind',
            match:
              kind === 'paper' && !metadataOnly
                ? { any: ['paper', 'paper_chunk'] }
                : { value: kind },
          },
        ],
      }
    : undefined;

  // Semantic candidates.
  let semanticResponse = await qdrant.query(COLLECTION, {
    query: queryVector,
    limit: paper ? PAPER_SEMANTIC_LIMIT : GLOBAL_SEMANTIC_LIMIT,
    with_payload: true,
    filter,
  });

  // No indexed PDF: retain the recognized paper's metadata instead of filling
  // the answer with unrelated global hits. The LLM can report missing detail.
  if (paper && !metadataOnly && !semanticResponse.points.length) {
    semanticResponse = await qdrant.query(COLLECTION, {
      query: queryVector,
      limit: 1,
      with_payload: true,
      filter: {
        must: [
          { key: 'kind', match: { value: 'paper' } },
          { key: 'uri', match: { value: paper.id } },
        ],
      },
    });
  }

  // Global lexical scoring reranks only the semantic candidates. No scroll,
  // additional lexical candidates or name bonus; the cap is applied later.
  const reranked = paper
    ? [...semanticResponse.points].sort(
        (a, b) => (b.score ?? 0) - (a.score ?? 0)
      )
    : rerankGlobalHits(semanticResponse.points, question);

  if (!paper) {
    // Temporary diagnostic: show every semantic candidate before deduplication.
    console.table(
      reranked.map(hit => ({
        vector: hit.vectorScore?.toFixed(4),
        lexical: hit.lexicalScore?.toFixed(2),
        hybrid: hit.hybridScore?.toFixed(4),
        kind: hit.payload?.kind,
        title: hit.payload?.title,
        section: hit.payload?.section,
        chunk: hit.payload?.chunkIndex,
      }))
    );
  }

  const ranked = selectContext(
    reranked.filter(
      hit => entityStore[hit.payload?.paperUri || hit.payload?.uri]
    ),
    Boolean(paper)
  );

  if (
    paper &&
    asksForPaperMetadata &&
    hasContentQuestion &&
    !ranked.some(hit => hit.payload.kind === 'paper')
  ) {
    // Reserve metadata independently of semantic ranking: PDF chunks must not
    // displace the authors/venue source, nor should metadata displace content.
    // The recognized entity is already available from the authoritative store.
    ranked.unshift({
      id: paper.id,
      score: null,
      payload: {
        kind: 'paper',
        uri: paper.id,
        name: paper.data.title || paper.data.name || paper.id,
      },
    });
  }

  const enriched = [];

  for (const hit of ranked) {
    const entity = getRdfEntity(hit.payload.paperUri || hit.payload.uri);

    let staff = [];
    let headProjects = [];

    if (hit.payload.kind === 'project') {
      staff = entity.staff || [];
    }

    if (hit.payload.kind === 'person') {
      const roles = names(entity?.data?.role);

      const isHead = roles.some(role => role.toLowerCase() === 'head');

      if (isHead) {
        headProjects = getAllProjects();
      }
    }

    enriched.push({
      hit,
      entity,
      staff,
      headProjects,
      context: buildContext(hit, entity, staff, headProjects),
    });
  }

  const ragContext = enriched
    .map(({ context }, i) => `SOURCE ${i + 1}\n${context}`)
    .join('\n\n---\n\n');

  const llmResult = await askLlm(question, ragContext);

  const usedIndexes = new Set(
    llmResult.sourceNumbers
      .filter(number => Number.isInteger(number))
      .map(number => number - 1)
      .filter(index => index >= 0 && index < enriched.length)
  );

  const usedSources = enriched
    .map(({ hit, entity }, index) => {
      let path = entity?.path || null;

      // RDF paper paths are identifiers, not generated Gatsby pages.
      if (['paper', 'paper_chunk'].includes(hit.payload.kind)) {
        path = '/publications/';
      }

      if (hit.payload.kind === 'group') {
        path = '/groups/';
      }

      if (hit.payload.kind === 'demo') {
        path = '/demos/';
      }

      if (hit.payload.kind === 'partner') {
        path = '/partners/';
      }

      return {
        index,
        sourceNumber: index + 1,
        uri: hit.payload.uri,
        kind: hit.payload.kind,
        name:
          entity?.data?.name ||
          entity?.data?.title ||
          hit.payload.name ||
          hit.payload.uri,
        path,
        score: hit.score,
        ...(hit.payload.kind === 'paper_chunk'
          ? {
              paperUri: hit.payload.paperUri,
              chunkId: hit.payload.chunkId,
              pdfUrl: hit.payload.pdfUrl,
              pageStart: hit.payload.pageStart,
              pageEnd: hit.payload.pageEnd,
              section: hit.payload.section,
              subsection: hit.payload.subsection,
            }
          : {}),
        ...(hit.payload.kind === 'person' && entity?.data?.name
          ? {
              person: Object.fromEntries(
                [
                  'name',
                  'namePrefix',
                  'role',
                  'phone',
                  'fax',
                  'email',
                  'chat',
                  'office',
                  'photo',
                  'sameAs',
                ].map(field => [field, entity.data[field]])
              ),
            }
          : {}),
        ...(['paper', 'paper_chunk'].includes(hit.payload.kind)
          ? {
              paper: {
                title:
                  entity.data.title || entity.data.name || hit.payload.name,
                authorName: entity.data.authorName?.length
                  ? entity.data.authorName
                  : names(entity.data.author),
                source: entity.data.source,
                year: entity.data.year,
                publicationType: entity.data.publicationType,
                url: entity.data.url,
                pdfUrl: entity.data.pdfUrl,
                doi: entity.data.doi,
                presentationUrl: entity.data.presentationUrl,
                videoUrl: entity.data.videoUrl,
                bibsonomyId: entity.data.bibsonomyId,
              },
            }
          : {}),
      };
    })
    .filter(source => usedIndexes.has(source.index))
    .map(({ index, ...source }) => source);

  // Presentation-only grouping: the LLM still receives independently numbered
  // chunk evidence, and only the sources it actually cited contribute pages.
  const sources = groupSourcesByPaper(usedSources);

  return {
    question,
    answer: llmResult.answer,
    sources,
  };
}
