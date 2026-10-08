import { EMBEDDING_MODEL, EMBEDDING_OPTIONS } from './embedding-config.mjs';
import fs from 'fs';
import readline from 'readline';
import { pipeline } from '@huggingface/transformers';

const FILE = process.argv[2] || '../data/rag/rag_embeddings.jsonl';

const QUERY = process.argv.slice(3).join(' ').trim();

if (!QUERY) {
  console.error(
    'Usage: node rag/search-local.mjs <embeddings-file> "your query"'
  );
  process.exit(1);
}

const MODEL = EMBEDDING_MODEL;

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

function detectRequestedKinds(query) {
  const q = query.toLowerCase();

  if (/\b(project|projects)\b/.test(q)) {
    return ['project'];
  }

  if (
    /\bwho\b/.test(q) ||
    /\b(person|people|researcher|researchers|staff|member|members)\b/.test(q)
  ) {
    return ['person'];
  }

  if (/\b(paper|papers|publication|publications)\b/.test(q)) {
    return ['paper'];
  }

  if (/\b(award|awards)\b/.test(q)) {
    return ['award'];
  }

  if (/\b(demo|demos|demonstration|demonstrations)\b/.test(q)) {
    return ['demo'];
  }

  if (/\b(group|groups|research group)\b/.test(q)) {
    return ['group'];
  }

  if (/\b(partner|partners)\b/.test(q)) {
    return ['partner'];
  }

  if (/\b(funder|funders|funding body)\b/.test(q)) {
    return ['funder'];
  }

  return null;
}

function dot(a, b) {
  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result += a[i] * b[i];
  }

  return result;
}

const results = [];

const rl = readline.createInterface({
  input: fs.createReadStream(FILE),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line.trim()) continue;

  const doc = JSON.parse(line);

  const score = dot(queryVector, doc.embedding);

  results.push({
    score,
    id: doc.id,
    metadata: doc.metadata,
    text: doc.text,
  });
}

const requestedKinds = detectRequestedKinds(QUERY);

let filteredResults = results;

if (requestedKinds) {
  filteredResults = results.filter(result =>
    requestedKinds.includes(result.metadata.kind)
  );

  console.log(`Type filter: ${requestedKinds.join(', ')}`);
}

filteredResults.sort((a, b) => b.score - a.score);

console.log('\nTop 10 results:\n');

for (const result of filteredResults.slice(0, 10)) {
  console.log(
    `${result.score.toFixed(4)} | ${result.metadata.kind} | ${
      result.metadata.name
    }`
  );

  console.log(`  ${result.metadata.uri}`);

  console.log(`  ${result.text.replace(/\n/g, ' ').slice(0, 220)}`);

  console.log();
}
