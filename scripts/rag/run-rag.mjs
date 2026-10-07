import { readFileSync } from 'node:fs';
import { env, pipeline } from '@huggingface/transformers';
import { QdrantClient } from '@qdrant/js-client-rest';
import { askLlm } from './ask-rag.mjs';

const MODEL = 'Xenova/all-MiniLM-L6-v2';

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

function nameMatchScore(question, name) {
  const q = normalize(question);
  const n = normalize(name);

  if (!q || !n) return 0;
  if (q === n) return 3;
  if (q.includes(n)) return 2.5;

  const queryTokens = q
    .split(' ')
    .filter(token => token.length >= 3 && !QUERY_STOP_WORDS.has(token));
  const nameTokens = n.split(' ');
  const matchingTokens = queryTokens.filter(
    token =>
      nameTokens.includes(token) ||
      nameTokens.some(nameToken => nameToken.startsWith(token))
  );

  if (!matchingTokens.length) return 0;
  if (matchingTokens.length >= 2) return 2;
  if (matchingTokens[0].length >= 4) return 1.5;
  return 0;
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

  if (d.content?.length) {
    const description = truncate(cleanContent(d.content.join('\n')));

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

const extractor = await pipeline('feature-extraction', MODEL, {
  device: 'cpu',
});

const qdrant = new QdrantClient({
  url: QDRANT_URL,
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

export async function runRag(question) {
  const kind = detectRequestedKind(question);

  if (kind && isBroadCategoryQuery(question, kind)) {
    return runBroadCategoryQuery(question, kind);
  }

  const tensor = await extractor(question, {
    pooling: 'mean',
    normalize: true,
  });

  const queryVector = tensor.tolist()[0];

  const filter = kind
    ? {
        must: [
          {
            key: 'kind',
            match: {
              value: kind,
            },
          },
        ],
      }
    : undefined;

  // Semantic candidates.
  const semanticResponse = await qdrant.query(COLLECTION, {
    query: queryVector,
    limit: 10,
    with_payload: true,
    filter,
  });

  // Lexical/name candidates.
  // The collection is small enough to scan
  // payload names directly.
  const lexicalResponse = await qdrant.scroll(COLLECTION, {
    limit: 1000,
    with_payload: true,
    with_vector: false,
    filter,
  });

  const lexicalMatches = lexicalResponse.points.filter(
    point => nameMatchScore(question, point.payload?.name) > 0
  );

  // Merge semantic and lexical candidates.
  const merged = new Map();

  for (const hit of semanticResponse.points) {
    merged.set(String(hit.id), {
      ...hit,
      semanticScore: hit.score,
    });
  }

  for (const hit of lexicalMatches) {
    const key = String(hit.id);

    if (!merged.has(key)) {
      merged.set(key, {
        ...hit,
        score: 0,
        semanticScore: 0,
      });
    }
  }

  // Hybrid reranking.
  const ranked = [...merged.values()]
    .map(hit => {
      const nameBonus = nameMatchScore(question, hit.payload?.name);

      return {
        ...hit,
        rerankScore: (hit.semanticScore || 0) + nameBonus,
      };
    })
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, 3);

  const enriched = [];

  for (const hit of ranked) {
    const entity = getRdfEntity(hit.payload.uri);

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

  const sources = enriched
    .map(({ hit, entity }, index) => {
      let path = entity?.path || null;

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
        uri: hit.payload.uri,
        kind: hit.payload.kind,
        name:
          entity?.data?.name ||
          entity?.data?.title ||
          hit.payload.name ||
          hit.payload.uri,
        path,
        score: hit.score,
      };
    })
    .filter(source => usedIndexes.has(source.index))
    .map(({ index, ...source }) => source);

  return {
    question,
    answer: llmResult.answer,
    sources,
  };
}
