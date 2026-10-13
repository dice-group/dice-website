# DICE Website RAG

This repository contains the DICE website RAG service. It combines DICE RDF metadata with full-text paper PDFs so users can ask questions about people, projects, publications, groups, awards, and paper content.

## How the pipeline works

There are two stages.

### 1. Prepare the knowledge

```text
DICE TTL/RDF
   │
   ├─ entity metadata ───────────────┐
   │                                 │
   └─ paper PDF URL                  │
          ↓                          │
      download PDF                   │
          ↓                          │
      extract text                   │
          ↓                          │
      split into chunks              │
          ↓                          │
      MiniLM embeddings              │
          └──────────────→ Qdrant ←──┘
```

Qdrant stores searchable vectors for normal DICE entities, paper metadata, and PDF chunks.

### 2. Answer a question

```text
user question
     ↓
MiniLM query embedding
     ↓
recognize a paper name when possible
     ↓
Qdrant retrieval
     ↓
rerank + deduplicate + select evidence
     ↓
build grounded LLM context
     ↓
LLM answer + cited source numbers
     ↓
group cited chunks by paper
     ↓
final answer + source cards
```

The important distinction is:

> **Qdrant finds the evidence. The LLM explains the evidence.**

For a question about one named paper, retrieval is restricted to that paper. For a global question, the service retrieves candidates across the index and applies a lexical bonus before selecting the final evidence.

---

# Local setup from scratch

## Prerequisites

Install:

- Git
- Docker with Docker Compose
- Node.js 22
- npm

The RAG Docker image already contains Poppler and `flock`, so they are only required on the host if you run PDF ingestion manually outside Docker.

## 1. Clone the repository

Until the RAG work is merged into the default branch, clone the RAG branch:

```bash
git clone --branch rag-2 --single-branch https://github.com/dice-group/dice-website.git
cd dice-website
```

If the RAG implementation has already been merged, clone the normal repository instead:

```bash
git clone https://github.com/dice-group/dice-website.git
cd dice-website
```

## 2. Install Node dependencies

```bash
npm --prefix scripts ci
```

## 3. Configure the LLM

Create `scripts/.env`:

```dotenv
DICE_LLM_API_KEY=YOUR_DICE_TOKEN
DICE_LLM_BASE_URL=https://dice-llm-api.cs.uni-paderborn.de/v1
LLM_MODEL=general-purpose

QDRANT_URL=http://host.docker.internal:6333
QDRANT_COLLECTION=dice_rag
```

Do not commit this file.

`QDRANT_URL=http://host.docker.internal:6333` is used by the RAG container. Host-side indexing commands use `http://127.0.0.1:6333` by default.

## 4. Start Qdrant

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

Check it:

```bash
curl http://127.0.0.1:6333/collections
```

## 5. Build the local entity store

```bash
npm --prefix scripts run rag:entities
```

This creates:

```text
data/rag/entities.json
```

The RAG server uses this file to enrich retrieved RDF entities.

## 6. Build and index RDF metadata

Generate vector documents:

```bash
npm --prefix scripts run rag:documents
```

Create MiniLM embeddings:

```bash
npm --prefix scripts run rag:embed
```

Index them into Qdrant:

```bash
npm --prefix scripts run rag:index
```

Verify the collection:

```bash
curl http://127.0.0.1:6333/collections/dice_rag
```

At this point Qdrant contains the normal RDF/entity metadata index.

## 7. Start the RAG API

```bash
docker compose \
  --env-file scripts/.env \
  -f compose.rag.yml \
  up -d --build
```

The API starts on:

```text
http://127.0.0.1:8787
```

The container also starts incremental paper ingestion by default. Paper PDFs are downloaded, extracted, chunked, embedded, and written directly to Qdrant.

Follow the logs:

```bash
docker compose -f compose.rag.yml logs -f rag
```

## 8. Check API health

```bash
curl -sS http://127.0.0.1:8787/health
```

Expected shape:

```json
{
  "status": "ok",
  "deployment": "local"
}
```

The health endpoint only confirms that the HTTP server and embedding model are ready. It does not prove that Qdrant or the LLM endpoint can answer a query.

## 9. Check PDF ingestion

```bash
curl -sS http://127.0.0.1:8787/api/rag/ingestion
```

Useful fields include the ingestion status and counts for discovered, unchanged, changed, failed, added, and removed paper chunks.

## 10. Ask the RAG API directly

```bash
curl -sS \
  -X POST http://127.0.0.1:8787/api/rag \
  -H 'Content-Type: application/json' \
  -d '{"question":"What datasets were used in ASTRA?"}'
```

With `jq`:

```bash
curl -sS \
  -X POST http://127.0.0.1:8787/api/rag \
  -H 'Content-Type: application/json' \
  -d '{"question":"What datasets were used in ASTRA?"}' \
  | jq
```

Another useful global test:

```bash
curl -sS \
  -X POST http://127.0.0.1:8787/api/rag \
  -H 'Content-Type: application/json' \
  -d '{"question":"Which DICE papers discuss entity alignment?"}' \
  | jq
```

A successful response contains the question, grounded answer, and sources.

---

# Run the website locally

Start Gatsby:

```bash
npm --prefix scripts run develop -- -H 0.0.0.0
```

Open:

```text
http://localhost:8000
```

For normal local HTTP development, the frontend can call the RAG service on port `8787`.

To override the API URL at Gatsby build time:

```bash
GATSBY_RAG_API_URL=http://127.0.0.1:8787/api/rag \
  npm --prefix scripts run develop -- -H 0.0.0.0
```

If Gatsby appears stale after RDF or frontend changes:

```bash
cd scripts
npx gatsby clean
npm run build
```

---

# Retrieval behavior

The current retrieval flow is intentionally small and predictable:

```text
question
→ recognize named paper when unambiguous
→ MiniLM query embedding
→ Qdrant top 10 scoped / top 20 global
→ global lexical rerank
→ remove stale and duplicate hits
→ global: max 3 PDF chunks per paper
→ select up to 5 scoped / 6 global evidence sources
→ add paper metadata for mixed scoped questions
→ build LLM context
→ answer + citations
→ group cited chunks by paperUri
```

For global retrieval:

```text
hybrid score = vector score + 0.20 × lexical score
```

The lexical score is only used to rerank the semantic candidates. It is not a separate full-text search.

---

# Paper ingestion

Paper ingestion is incremental.

For every publication with a usable `pdfUrl` or fallback `url`, the service:

```text
download PDF
→ SHA-256 the PDF bytes
→ extract text with Poppler
→ detect sections/tables
→ create chunks
→ create MiniLM embeddings
→ upload the new generation to Qdrant
→ remove the previous generation
```

Unchanged PDFs are skipped after their bytes are checked.

PDF chunks store metadata such as:

```text
paperUri
title
pdfUrl
pageStart / pageEnd
section / subsection
contentType
chunkIndex
pipelineVersion
text
```

The current PDF pipeline is version 3.

---

# Updating data

## RDF / TTL changes

After changing DICE RDF data:

```bash
npm --prefix scripts run rag:entities
npm --prefix scripts run rag:documents
npm --prefix scripts run rag:embed
npm --prefix scripts run rag:index
```

Then rebuild the RAG container because `entities.json` is bundled into the image:

```bash
docker compose \
  --env-file scripts/.env \
  -f compose.rag.yml \
  up -d --build --force-recreate rag
```

## Only LLM settings changed

No Qdrant rebuild is required.

Recreate the RAG service:

```bash
docker compose \
  --env-file scripts/.env \
  -f compose.rag.yml \
  up -d --build --force-recreate rag
```

## Only frontend changed

Rebuild or restart Gatsby. No RAG re-indexing is required.

## PDF extraction/chunking logic changed

Increase `PIPELINE_VERSION`. The next ingestion will reprocess existing PDFs even when their bytes have not changed.

---

# Manual paper ingestion

Normally Docker performs ingestion automatically.

To run it manually on Debian/Ubuntu, install:

```bash
sudo apt-get update
sudo apt-get install poppler-utils util-linux
```

Then export the Qdrant settings:

```bash
export QDRANT_URL=http://127.0.0.1:6333
export QDRANT_COLLECTION=dice_rag
```

Run:

```bash
npm --prefix scripts run rag:entities

mkdir -p data/rag/ingestion

flock --exclusive \
  data/rag/ingestion/ingestion.lock \
  node scripts/rag/ingest-papers.mjs
```

Do not run multiple ingestion writers against the same collection independently.

---

# Useful commands

Check running containers:

```bash
docker ps
```

RAG logs:

```bash
docker compose -f compose.rag.yml logs -f rag
```

Restart without rebuilding:

```bash
docker compose \
  --env-file scripts/.env \
  -f compose.rag.yml \
  restart rag
```

Rebuild after code changes:

```bash
docker compose \
  --env-file scripts/.env \
  -f compose.rag.yml \
  up -d --build --force-recreate rag
```

Stop the RAG service:

```bash
docker compose -f compose.rag.yml down
```

Inspect the Qdrant collection:

```bash
curl http://127.0.0.1:6333/collections/dice_rag
```

---

# Minimal smoke test

After a fresh installation, these checks should all pass:

```bash
# Qdrant
curl -f http://127.0.0.1:6333/collections/dice_rag

# RAG server
curl -f http://127.0.0.1:8787/health

# Ingestion state
curl -f http://127.0.0.1:8787/api/rag/ingestion

# End-to-end retrieval + LLM
curl -f \
  -X POST http://127.0.0.1:8787/api/rag \
  -H 'Content-Type: application/json' \
  -d '{"question":"Who authored ASTRA and what datasets were used?"}'
```

The final request is the important end-to-end test because it exercises:

```text
query embedding
→ Qdrant retrieval
→ metadata + PDF evidence
→ LLM
→ citations
```

---

# Production notes

Production needs more than the local setup:

- Qdrant must be reachable from the deployed RAG container.
- `DICE_LLM_API_KEY` / `LLM_API_KEY` must remain secret.
- Do not commit `scripts/.env`.
- The public `/api/rag` endpoint currently has no application-level authentication.
- Add proxy-level rate limiting / usage controls before exposing a limited (if needed) LLM endpoint publicly.
- Use HTTPS in production.
- Keep the embedding model and revision identical for indexing and querying.
- If the embedding model changes, rebuild all embeddings. If its vector dimension changes, create a new Qdrant collection.
- Monitor `/api/rag/ingestion` and container logs for failed PDF downloads/extractions.
- Back up the persistent Qdrant storage and the RAG model/ingestion volume as appropriate.

---

# What is stored where?

| Data | Location |
|---|---|
| RDF/TTL source data | repository `data/` |
| Enriched local entity store | `data/rag/entities.json` |
| Metadata vector documents | `data/rag/rag_documents.jsonl` |
| Metadata embeddings | `data/rag/rag_embeddings.jsonl` |
| Entity/paper/PDF vectors | Qdrant `dice_rag` collection |
| PDF ingestion state | persistent RAG model-cache volume |
| MiniLM model cache | persistent RAG model-cache volume |

PDF files and generated PDF chunk vectors are not committed to the repository.
