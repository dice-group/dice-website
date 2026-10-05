import fs from "fs";
import readline from "readline";
import { pipeline } from "@huggingface/transformers";

const FILE =
  process.argv[2] || "../data/rag/rag_embeddings.jsonl";

const QUERY = process.argv.slice(3).join(" ").trim();

if (!QUERY) {
  console.error(
    'Usage: node rag/search-local.mjs <embeddings-file> "your query"'
  );
  process.exit(1);
}

const MODEL = "Xenova/all-MiniLM-L6-v2";

console.log(`Loading model: ${MODEL}`);

const extractor = await pipeline(
  "feature-extraction",
  MODEL,
  {
    device: "cpu",
  }
);

console.log(`Query: ${QUERY}`);

const tensor = await extractor(QUERY, {
  pooling: "mean",
  normalize: true,
});

const queryVector = tensor.tolist()[0];

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

results.sort((a, b) => b.score - a.score);

console.log("\nTop 10 results:\n");

for (const result of results.slice(0, 10)) {
  console.log(
    `${result.score.toFixed(4)} | ${result.metadata.kind} | ${result.metadata.name}`
  );

  console.log(`  ${result.metadata.uri}`);

  console.log(
    `  ${result.text.replace(/\n/g, " ").slice(0, 220)}`
  );

  console.log();
}