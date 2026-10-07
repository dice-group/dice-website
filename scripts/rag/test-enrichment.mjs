import { pipeline } from '@huggingface/transformers';
import { QdrantClient } from '@qdrant/js-client-rest';
import { askLlm } from './ask-rag.mjs';

const QUERY = process.argv.slice(2).join(' ').trim();

if (!QUERY) {
  console.error('Usage: node rag/test-enrichment.mjs "your query"');
  process.exit(1);
}

const MODEL = 'Xenova/all-MiniLM-L6-v2';

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';

const COLLECTION = process.env.QDRANT_COLLECTION || 'dice_rag';

const GRAPHQL_URL =
  process.env.GRAPHQL_URL || 'http://127.0.0.1:8000/___graphql';

function detectRequestedKind(query) {
  const q = query.toLowerCase();

  if (/\b(project|projects)\b/.test(q)) return 'project';

  if (
    /\bwho\b/.test(q) ||
    /\b(person|people|researcher|researchers|staff|member|members)\b/.test(q)
  ) {
    return 'person';
  }

  if (/\b(paper|papers|publication|publications)\b/.test(q)) {
    return 'paper';
  }

  if (/\b(award|awards)\b/.test(q)) return 'award';
  if (/\b(demo|demos|demonstration|demonstrations)\b/.test(q)) return 'demo';
  if (/\b(group|groups|research group)\b/.test(q)) return 'group';
  if (/\b(partner|partners)\b/.test(q)) return 'partner';
  if (/\b(funder|funders|funding body)\b/.test(q)) return 'funder';

  return null;
}

async function graphql(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GraphQL HTTP ${response.status}: ${await response.text()}`
    );
  }

  const result = await response.json();

  if (result.errors) {
    console.error(result.errors);
    throw new Error('GraphQL query failed');
  }

  return result.data;
}

async function fetchRdfEntity(id) {
  const query = `
    query EntityById($id: String!) {
      rdf(id: { eq: $id }) {
        id
        subject
        path

        data {
          name
          tagline
          content
          status
          startDate
          endDate
          publicationTag

          maintainer {
            id
            path
            data {
              name
            }
          }

          partner {
            id
            path
            data {
              name
            }
          }

          funder {
            id
            path
            data {
              name
            }
          }

          role {
            id
            data {
              name
            }
          }

          project {
            id
            path
            data {
              name
              tagline
            }
          }

          member {
            id
            path
            data {
              name
            }
          }

          relatedProject {
            id
            path
            data {
              name
              tagline
            }
          }

          author {
            id
            path
            data {
              name
            }
          }

          authorName

          title
          publicationType
          source
          year
          tag

          awardee {
            id
            path
            data {
              name
            }
          }

          awardeeExternal
        }
      }
    }
  `;

  const data = await graphql(query, { id });
  return data.rdf;
}

function cleanContent(value) {
  if (!value) return '';

  return (
    value
      // Remove entire HTML tables
      .replace(/<table[\s\S]*?<\/table>/gi, ' ')

      // Remove markdown links but keep visible text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, ' ')

      // Remove markdown headings
      .replace(/#{1,6}\s*/g, '')

      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function truncate(value, max = 2000) {
  if (value.length <= max) return value;

  return value.slice(0, max) + '...';
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

function buildContext(hit, entity) {
  if (!entity) {
    return [
      `URI: ${hit.payload.uri}`,
      `Type: ${hit.payload.kind}`,
      'Entity not found in Gatsby GraphQL',
    ].join('\n');
  }

  const d = entity.data || {};

  const lines = [
    `URI: ${entity.id}`,
    `Path: ${entity.path}`,
    `Type: ${hit.payload.kind}`,
  ];

  if (d.name) lines.push(`Name: ${d.name}`);
  if (d.tagline) lines.push(`Tagline: ${d.tagline}`);

  if (d.content?.length) {
    const description = truncate(cleanContent(d.content.join('\n')), 2000);

    lines.push(`Description: ${description}`);
  }

  if (d.status) lines.push(`Status: ${d.status}`);
  if (d.startDate) lines.push(`Start date: ${d.startDate}`);
  if (d.endDate) lines.push(`End date: ${d.endDate}`);
  if (d.year) lines.push(`Year: ${d.year}`);

  if (d.title) lines.push(`Title: ${d.title}`);

  if (d.publicationType) {
    lines.push(`Publication type: ${d.publicationType}`);
  }

  if (d.source) lines.push(`Source: ${d.source}`);

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

  const projects = names(d.project);
  if (projects.length) {
    lines.push(`Projects: ${projects.join(', ')}`);
  }

  const members = names(d.member);
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

console.log(`Loading model: ${MODEL}`);

const extractor = await pipeline('feature-extraction', MODEL, {
  device: 'cpu',
});

const tensor = await extractor(QUERY, {
  pooling: 'mean',
  normalize: true,
});

const queryVector = tensor.tolist()[0];

const qdrant = new QdrantClient({
  url: QDRANT_URL,
});

const kind = detectRequestedKind(QUERY);

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

if (kind) {
  console.log(`Type filter: ${kind}`);
}

const response = await qdrant.query(COLLECTION, {
  query: queryVector,
  limit: 3,
  with_payload: true,
  filter,
});

const hits = response.points;

const enriched = [];

for (const hit of hits) {
  const entity = await fetchRdfEntity(hit.payload.uri);

  enriched.push({
    hit,
    entity,
    context: buildContext(hit, entity),
  });
}

const ragContext = enriched
  .map(({ context }, i) => `SOURCE ${i + 1}\n${context}`)
  .join('\n\n---\n\n');

console.log('\n===== RAG CONTEXT =====\n');

console.log(
  enriched
    .map(({ context }, i) => `SOURCE ${i + 1}\n${context}`)
    .join('\n\n---\n\n')
);

console.log('\n===== ENRICHED DEBUG =====\n');

for (const { hit, entity } of enriched) {
  console.log('='.repeat(80));

  console.dir(
    {
      score: hit.score,
      kind: hit.payload.kind,
      uri: hit.payload.uri,
      entity,
    },
    { depth: null }
  );
}

console.log('\n===== LLM ANSWER =====\n');

const answer = await askLlm(QUERY, ragContext);

console.log(answer);
