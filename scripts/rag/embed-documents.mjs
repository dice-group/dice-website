import fs from 'fs';
import readline from 'readline';
import { pipeline, env } from '@huggingface/transformers';
import {
  EMBEDDING_MODEL,
  EMBEDDING_OPTIONS,
  EMBEDDING_VERSION,
} from './embedding-config.mjs';

env.backends.onnx.wasm.numThreads = 1;

const INPUT = process.argv[2] || '../data/rag/rag_documents.jsonl';

const OUTPUT = process.argv[3] || '../data/rag/rag_embeddings.jsonl';

const MODEL = EMBEDDING_MODEL;

console.log(`Loading model: ${MODEL}`);

const extractor = await pipeline(
  'feature-extraction',
  MODEL,
  EMBEDDING_OPTIONS
);

const input = fs.createReadStream(INPUT);

const rl = readline.createInterface({
  input,
  crlfDelay: Infinity,
});

const output = fs.createWriteStream(OUTPUT);

let count = 0;

for await (const line of rl) {
  if (!line.trim()) continue;

  const doc = JSON.parse(line);

  const tensor = await extractor(doc.text, {
    pooling: 'mean',
    normalize: true,
  });

  const embedding = tensor.tolist()[0];

  output.write(
    JSON.stringify({
      ...doc,
      metadata: { ...doc.metadata, embeddingModel: EMBEDDING_VERSION },
      embedding,
    }) + '\n'
  );

  count++;

  if (count % 25 === 0) {
    console.log(`Embedded ${count}`);
  }
}

output.end();

console.log(`Done. Embedded ${count} documents.`);
console.log(`Written to ${OUTPUT}`);
