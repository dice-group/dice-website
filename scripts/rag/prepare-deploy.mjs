import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = process.argv[2];
if (!output)
  throw new Error(
    'Usage: node scripts/rag/prepare-deploy.mjs OUTPUT_DIRECTORY'
  );
if (!process.env.RAG_QDRANT_URL)
  throw new Error(
    'Set the RAG_QDRANT_URL repository variable to a URL reachable from the Exoframe container.'
  );
const qdrantUrl = new URL(process.env.RAG_QDRANT_URL);
if (!['http:', 'https:'].includes(qdrantUrl.protocol))
  throw new Error('RAG_QDRANT_URL must use HTTP or HTTPS.');
if (['localhost', '127.0.0.1', '[::1]'].includes(qdrantUrl.hostname))
  throw new Error('RAG_QDRANT_URL cannot point to container loopback.');
for (const key of ['LLM_API_KEY', 'LLM_MODEL']) {
  if (!process.env[key])
    throw new Error(`Set the ${key} GitHub Actions secret.`);
}
const target = path.resolve(output);
mkdirSync(target, { recursive: true });
// Explicit allowlist: never upload the checkout, .env files, or local caches.
for (const filename of [
  'scripts/rag/server.mjs',
  'scripts/rag/run-rag.mjs',
  'scripts/rag/ask-rag.mjs',
  'scripts/rag/docker/package.json',
  'scripts/rag/docker/package-lock.json',
  'data/rag/entities.json',
]) {
  const destination = path.join(target, filename);
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(path.join(root, filename), destination);
}
JSON.parse(readFileSync(path.join(target, 'data/rag/entities.json'), 'utf8'));
cpSync(
  path.join(root, 'scripts/rag/Dockerfile'),
  path.join(target, 'Dockerfile')
);
const config = {
  name: 'dice-rag',
  project: 'dice-rag',
  restart: 'always',
  domain:
    'Host(`dice-research.org`, `www.dice-research.org`) && PathPrefix(`/api/rag`)',
  port: '8787',
  env: {
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_MODEL: process.env.LLM_MODEL,
    LLM_BASE_URL:
      process.env.LLM_BASE_URL || 'https://dice-llm-api.cs.uni-paderborn.de/v1',
    QDRANT_URL: process.env.RAG_QDRANT_URL,
    QDRANT_COLLECTION: process.env.RAG_QDRANT_COLLECTION || 'dice_rag',
  },
  volumes: ['dice-rag-model-cache:/app/model-cache'],
};
writeFileSync(
  path.join(target, 'exoframe.json'),
  JSON.stringify(config, null, 2) + '\n',
  { mode: 0o600 }
);
// Exoframe reads this config, but Docker must not receive it in its build context.
writeFileSync(path.join(target, '.dockerignore'), 'exoframe.json\n');
console.log('Prepared isolated RAG deployment bundle.');
