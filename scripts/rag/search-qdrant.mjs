import { EMBEDDING_MODEL, EMBEDDING_OPTIONS } from './embedding-config.mjs';
import { pipeline } from '@huggingface/transformers';
import { QdrantClient } from '@qdrant/js-client-rest';

const QUERY = process.argv.slice(2).join(' ').trim();

if (!QUERY) {
  console.error('Usage: node rag/search-qdrant.mjs "your query"');
  process.exit(1);
}

const MODEL = EMBEDDING_MODEL;

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';

const COLLECTION = process.env.QDRANT_COLLECTION || 'dice_rag';

function detectRequestedKind(query) {
  const q = query.toLowerCase();

  if (/\b(project|projects)\b/.test(q)) {
    return 'project';
  }

  if (
    /\bwho\b/.test(q) ||
    /\b(person|people|researcher|researchers|staff|member|members)\b/.test(q)
  ) {
    return 'person';
  }

  if (/\b(paper|papers|publication|publications)\b/.test(q)) {
    return 'paper';
  }

  if (/\b(award|awards)\b/.test(q)) {
    return 'award';
  }

  if (/\b(demo|demos|demonstration|demonstrations)\b/.test(q)) {
    return 'demo';
  }

  if (/\b(group|groups|research group)\b/.test(q)) {
    return 'group';
  }

  if (/\b(partner|partners)\b/.test(q)) {
    return 'partner';
  }

  if (/\b(funder|funders|funding body)\b/.test(q)) {
    return 'funder';
  }

  return null;
}

console.log(`Loading model: ${MODEL}`);

const extractor = await pipeline(
  'feature-extraction',
  MODEL,
  EMBEDDING_OPTIONS
);

console.log(`Query: ${QUERY}`);

const tensor = await extractor(QUERY, {
  pooling: 'mean',
  normalize: true,
});

const queryVector = tensor.tolist()[0];

const client = new QdrantClient({
  url: QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const kind = detectRequestedKind(QUERY);

if (kind) {
  console.log(`Type filter: ${kind}`);
}

const filter = kind
  ? {
      must: [
        {
          key: 'kind',
          match:
            kind === 'paper'
              ? { any: ['paper', 'paper_chunk'] }
              : { value: kind },
        },
      ],
    }
  : undefined;

const response = await client.query(COLLECTION, {
  query: queryVector,
  limit: 10,
  with_payload: true,
  filter,
});

const results = response.points;

console.log('\nTop 10 results:\n');

for (const result of results) {
  const payload = result.payload;

  console.log(`${result.score.toFixed(4)} | ${payload.kind} | ${payload.name}`);

  console.log(`  ${payload.uri}`);

  if (payload.text) {
    console.log(`  ${payload.text.replace(/\n/g, ' ').slice(0, 220)}`);
  }

  console.log();
}
