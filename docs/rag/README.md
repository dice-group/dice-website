# Runtime flow

```text
user query
→ MiniLM embedding
→ recognize a named paper when unambiguous
→ Qdrant top 10 (paper-scoped or global)
→ deduplicate and select up to 5 scoped / 6 global sources
→ Local entity store enrichment
→ cleaned context
→ LLM
→ final answer
```

# The RAG index currently contains these entity types:

- person
- paper (publication metadata)
- paper_chunk (PDF content excerpts)
- project
- group
- demo
- partner
- funder
- award

# One TTL object's main RDF resource = one vector document.

Retrieval unit: one primary RDF resource represented by one TTL file / RDF subject. Generate type-specific human-readable embedding text from selected semantic properties. Preserve the URI and entity type as vector metadata. Relationships are resolved from TTL into `data/rag/entities.json` at build time. The RAG server loads this artifact at startup.

```sh
npm run rag:documents
```

# Embeddings

```sh
npm run rag:embed
npm run rag:search -- "scalable RDF data integration"
```

# Qdrant

```sh
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

```sh
curl http://127.0.0.1:6333/collections
npm run rag:index
curl http://127.0.0.1:6333/collections/dice_rag
```

### FAQ

**What data is included in the RAG system?**  
People, projects, publications, research groups, demos, partners, funders, and awards from the DICE RDF data.

**How are entities searched?**  
The system combines semantic vector search with lexical name matching.

**Which embedding model is used?**  
`Xenova/all-MiniLM-L6-v2`, producing 384-dimensional embeddings.

**Where are embeddings stored?**  
In Qdrant.

**Does the LLM answer directly from Qdrant?**  
Qdrant finds entity metadata and PDF excerpts. Entity hits are enriched from the local RDF store; PDF hits supply their extracted text, title, section, and page range to the LLM.

**Is all RDF data embedded?**  
No. Only useful human-readable fields such as names, descriptions, roles, projects, authors, members, tags, and similar metadata are embedded.

**How is the RAG index updated?**  
Each RAG container deployment synchronizes paper metadata and checks PDF bytes for changes, then updates paper chunks incrementally. Other entity types still use the document/embed/index commands.

**How are sources shown?**  
The answer includes links back to the relevant DICE website pages.

## Production entity store

From `scripts/`, generate the store with:

```sh
npm run rag:entities
```

This reads TTL files (excluding examples, `papers_all`, and generated RAG data), resolves relationship names and roles, and precomputes project staff excluding alumni. Output is written atomically to `data/rag/entities.json`. Project paths follow the Gatsby RDF transformer: for example, `/TRR318_INF`.

`npm run build` regenerates the store through `prebuild`, including weekly builds. When updating the RAG index, regenerate this store from the same TTL snapshot. No Gatsby development server or runtime RDF parser is needed.

Deploy `entities.json` alongside the Node RAG service. The deployment workflows package this store alongside the RAG service. The default location is `data/rag/entities.json` relative to the repository; for a separate service deployment use:

```sh
RAG_ENTITY_STORE=/srv/dice-rag/entities.json npm run rag:server
```

Restart the RAG server 
```sh
docker compose --env-file scripts/.env -f compose.rag.yml restart rag
```
after replacing the store: it is loaded once at startup. Missing or invalid files stop startup with a generation hint; missing indexed entities fail the query with a regeneration hint instead of silently losing enrichment. `GRAPHQL_URL` is no longer used by `run-rag.mjs` (the standalone legacy enrichment diagnostic still uses it).

## Docker RAG server

From the repository root, generate the entity store and start the container:

```sh
npm --prefix scripts run rag:entities
# Set DICE_LLM_API_KEY in your shell first, or use --env-file with a private file.
docker compose --env-file scripts/.env -f compose.rag.yml up -d --build
curl http://127.0.0.1:8787/health
```

Stop any locally running RAG server first so port 8787 is available. The image contains only the RAG runtime dependencies and generated entity store; it does not include Gatsby, TTL files, or API keys. It runs as a non-root user on Node 22. The first startup downloads MiniLM; subsequent starts reuse the `rag-model-cache` volume. Initial startup needs access to Hugging Face, and answering needs access to the DICE LLM API and Qdrant.

Compose uses your **existing indexed Qdrant** at `http://host.docker.internal:6333` by default. Qdrant must be reachable through the host gateway (for example, the published port from the Qdrant Docker command above). A service bound only to host loopback is not reachable through that gateway. Set `QDRANT_URL` to another reachable address as needed; `127.0.0.1` inside the RAG container refers to the RAG container itself. `QDRANT_COLLECTION` and `LLM_MODEL` can also be overridden. On startup, paper ingestion creates the collection if needed and synchronizes paper metadata and PDF chunks. Set `RAG_INGEST_PAPERS=0` to disable it locally. The remaining entity kinds must still be indexed with the existing commands.

```sh
docker compose -f compose.rag.yml logs -f rag
docker compose -f compose.rag.yml down
```

After changing TTL data, regenerate both the entity store and matching Qdrant index, then rebuild/recreate the container. The entity store is bundled into the image. The health check confirms HTTP server readiness after model initialization; it does not test Qdrant or OpenAI availability.

The API is published on port 8787 on all host interfaces for LAN access. Restrict it to your trusted network: the API has no authentication. For HTTP previews, the frontend uses the website hostname with port 8787, so a site opened at `http://SERVER:9000` calls `http://SERVER:8787/api/rag`. For HTTPS deployments, proxy `/api/rag` on the website origin. Set `GATSBY_RAG_API_URL` at website build time to override this URL.

After changing frontend settings, rebuild the static site. After changing Compose ports, recreate the service:

```sh
docker compose --env-file scripts/.env -f compose.rag.yml up -d
```

## GitHub Actions deployment (Exoframe)

Both `.github/workflows/deploy.yml` and `.github/workflows/weekly-deploy.yml` deploy the RAG API through the existing Exoframe endpoint before deploying the website. They share a deployment concurrency group to prevent overlapping production updates. The website build sets `GATSBY_RAG_API_URL=/api/rag`.

RAG has its own deployment/project name, `dice-rag`, separate from `dice-website`. Its Traefik rule routes `/api/rag` on `dice-research.org` and `www.dice-research.org` to container port 8787; there is no host port publishing. A persistent `dice-rag-model-cache` volume holds model downloads. A bounded readiness check calls `/api/rag/health` before the website update. This checks server readiness, not the LLM or Qdrant responses.

Before enabling these workflow changes:

1. Set GitHub Actions secrets **`LLM_API_KEY`** and **`LLM_MODEL`**. Use your DICE LLM token and `general-purpose` as the model. Optionally set **`LLM_BASE_URL`** to a replacement provider's API base URL. No separate Exoframe LLM secret is required.
2. Set GitHub Actions repository variable **`RAG_QDRANT_URL`** to the existing production Qdrant URL reachable from the Exoframe container. Use a private network address, not container loopback or the development host-gateway assumption. Provision a reachable Qdrant service. Deployment creates the collection if missing and synchronizes papers/PDF chunks; index the other entity kinds separately from the same snapshot.
3. Optionally set **`RAG_QDRANT_COLLECTION`** (default `dice_rag`). The existing **`EXO_TOKEN_DICE`** secret is reused for deployment.
4. Confirm Exoframe can route the combined Host/PathPrefix rule and that the deployment user can create the model-cache volume. Run a manual deployment and check `/api/rag/health`, then submit a real query.

`prepare-deploy.mjs` creates a temporary, explicitly allowlisted upload containing only the runtime files, locked dependency manifests, Dockerfile, generated entities, and Exoframe configuration. It never uploads `scripts/.env` or the full checkout. `entities.json` comes from the same paper update and TTL snapshot as the website build. Paper metadata and chunks are synchronized from that snapshot after startup; retrieval omits hits whose parent no longer exists in the store. Coordinate other entity index updates separately. Missing `RAG_QDRANT_URL` stops deployment rather than silently selecting a development database.

The workflow integration does not change the existing public API's lack of authentication or add request rate limits. HTTPS protects transport; configure usage controls at the proxy before opening the paid API to unrestricted traffic.

### LLM configuration

GitHub is the source of deployment credentials: both workflows inject `LLM_API_KEY`, `LLM_MODEL`, and optional `LLM_BASE_URL` into the temporary Exoframe runtime configuration. That file has restricted permissions, is excluded from the Docker build context, is never uploaded as an Actions artifact, and is removed after the deployment step even on failure. Exoframe receives these values over HTTPS and supplies them as container environment variables; administrators of the deployment host can access them.

The adapter uses **Chat Completions** at `https://dice-llm-api.cs.uni-paderborn.de/v1`, with model `general-purpose`. It requests the answer and source numbers as JSON in the prompt, then validates the response locally. It does not require Responses API or server-side JSON-schema support. The OpenAI SDK is retained only as a compatible HTTP client.

For local use, set these in `scripts/.env`:

```dotenv
DICE_LLM_API_KEY=YOUR_DICE_TOKEN
DICE_LLM_BASE_URL=https://dice-llm-api.cs.uni-paderborn.de/v1
LLM_MODEL=general-purpose
```

Generic `LLM_API_KEY` and `LLM_BASE_URL` aliases remain supported. `DICE_LLM_*` values take precedence locally. Old `OPENAI_*` settings are no longer used, to avoid sending an OpenAI token to the DICE endpoint. GitHub workflows keep the generic secret names: update `LLM_API_KEY` with your DICE token, `LLM_MODEL` with `general-purpose`, and replace any old `LLM_BASE_URL` secret with the DICE URL (or remove it to use the default).

Rebuild the RAG container after updating the settings:

```sh
docker compose --env-file scripts/.env -f compose.rag.yml up -d --build
```

No embedding or Qdrant index rebuild is needed for changing the answer model.


## Incremental paper PDF ingestion

Both production workflows start ingestion in the deployed RAG container and collect its report into the GitHub Actions job summary. The API remains available during ingestion. The report step waits for the current deployment ID, so an old container cannot accidentally satisfy it. It waits up to four hours; a timeout fails the workflow without cancelling the container's ingestion. Fatal setup/database errors fail the report step. Individual PDF failures are logged and counted while the remaining papers continue; `RAG_PDF_STRICT=1` makes those failures fatal too.

The strictly parsed Turtle entity snapshot preserves each publication subject URI, `pdfUrl`, and `url`. Ingestion prefers a nonempty `pdfUrl`; when absent, it tries the paper’s `url`. The URL need not end in `.pdf`: the response must pass the same PDF content validation. HTML landing pages are logged and skipped. An explicit but failing `pdfUrl` does not fall back to `url`. The selected URL is stored as `pdfUrl` in chunk payloads and ingestion state, and the report’s `withPdfUrl` count includes fallback URLs. Every startup downloads each declared PDF again and computes SHA-256 over the bytes, including when the URL is unchanged. Unchanged, complete generations skip extraction and embedding. Downloads have a 30-second timeout and a 40 MiB limit; extraction has its own timeout and output limit. HTML, invalid PDFs, encrypted files, and files without usable text are reported as failures. No OCR is performed.

`pdf-chunks.mjs` uses Poppler reading-order extraction, removes recurring page-edge headers/footers and page numbers, repairs line-break hyphenation, and stops at a standalone References/Bibliography heading. Cleanup and section detection are heuristic; complex layouts can still require manual inspection. Chunks carry physical PDF page numbers (starting at 1), section/subsection when detected, and a maximum of 220 model tokens with up to 20 words of overlap. Bump `PIPELINE_VERSION` after changing extraction or chunking behavior.

Each content point contains `kind: paper_chunk`, `paperUri`, `parentId`, `title`, `pdfUrl`, `pdfHash`, `chunkIndex`, `pageStart`, `pageEnd`, `section`, `subsection`, `pipelineVersion`, `embeddingModel`, `generation`, and the extracted `text`. Chunk IDs deterministically hash the parent, generation, index, and text into Qdrant UUIDs. Metadata remains a separate `kind: paper` point under its existing URI-derived ID, including when PDF ingestion fails.

A replacement is fully extracted, chunked, and embedded before any writes. New generation points are uploaded with acknowledged writes; only then are old generations deleted with a `paperUri` + `kind` filter. There is no multi-request transaction: readers can briefly see both generations, and an interrupted upload can leave partial new points alongside the intact old set. The next run reconciles actual Qdrant points against saved state and retries deterministically. State is committed atomically only after replacement/cleanup succeeds. Missing papers and papers with neither a usable `pdfUrl` nor `url` value delete their chunks even if no local state survives. Removing `pdfUrl` while retaining `url` triggers a check of that fallback URL instead of immediate deletion. Failed downloads preserve old chunks.

State and the OS-managed ingestion lock live in `/app/model-cache/ingestion` on the existing persistent model-cache volume. State is scoped to Qdrant URL and collection. All writers must share this lock; do not launch independent ingestion against the same collection from another host. The ingestion report is available at `GET /api/rag/ingestion` and in container logs, with papers found, URLs, unchanged/new/changed/reprocessed/failed PDFs, and chunks added/removed. Restarts also perform a check.

Generate the entity store again before rebuilding an existing installation, since publication records now include their kind. Local manual ingestion requires Node 22, the RAG dependencies, `poppler-utils`, and `flock` from `util-linux`:

Install the system dependencies on Debian/Ubuntu before running ingestion:

```sh
sudo apt-get update
sudo apt-get install poppler-utils util-linux
```

The Docker image already installs these packages. A local Node invocation uses the host's tools, so Docker's installed packages do not satisfy its prerequisites. Ingestion checks `pdfinfo` and `pdftotext` before loading the model, downloading PDFs, or modifying Qdrant; a missing or unusable executable stops the run with an installation hint.

```sh
npm --prefix scripts run rag:entities
mkdir -p data/rag/ingestion
flock --exclusive data/rag/ingestion/ingestion.lock node scripts/rag/ingest-papers.mjs
```

`spawn pdfinfo ENOENT` means `pdfinfo` could not be found on the process's `PATH`. After installing Poppler, rerun the same ingestion command; failed PDFs were not marked successfully ingested. HTTP 403/418 responses and HTML instead of PDF are separate source failures. Installing Poppler does not fix those URLs: supply a working direct PDF URL in the Turtle record, or let ingestion log and skip them while retaining any previous chunks.

Set `QDRANT_URL`, `QDRANT_COLLECTION`, and optional `QDRANT_API_KEY` in the environment. If using the container's database concurrently, use its shared lock/state directory instead of a separate local directory. Manual ingestion reads exported environment variables, not `scripts/.env` automatically.

`RAG_EMBEDDING_MODEL` and `RAG_EMBEDDING_REVISION` are shared by ingestion, query embedding, and the embedding CLI. The default is `Xenova/all-MiniLM-L6-v2@main`; pin the revision to an immutable model commit for reproducible production runs. Changing either setting re-embeds paper metadata and PDF chunks. Also regenerate **all other entity embeddings** before serving queries with a changed model: equal vector dimensions do not imply compatible embedding spaces. A dimension change requires a new collection and a full index rebuild. The legacy index CLI expects 384 dimensions. In GitHub Actions, these settings and `RAG_PDF_STRICT` are optional repository variables; `QDRANT_API_KEY` is an optional secret.

PDF ingestion writes directly to Qdrant; the local `rag_documents.jsonl` and `rag_embeddings.jsonl` remain the metadata CLI artifacts. No PDFs or generated chunk vectors are committed to the repository.

## Retrieval depth

Retrieval first looks for an unambiguous paper title or a distinctive acronym before a title colon (for example, `ASTRA: Adaptive ...`) in the local entity store. Matching is case-insensitive and respects word boundaries. Generic title-word overlap is not enough to scope a query. Ambiguous matches, questions naming multiple papers, and plural/comparison queries remain global.

For “What datasets were used in ASTRA?”, the recognized paper URI restricts the semantic search to `kind = paper_chunk AND paperUri = <ASTRA URI>`. Qdrant returns up to 10 candidates; exact duplicate excerpts are removed, and the best 5 go to the LLM in semantic-score order. There is no global lexical expansion for this path. If the paper has no indexed chunks, retrieval falls back to that paper’s metadata. Authorship/publication metadata questions search its `kind = paper` record directly.

Global questions such as “Which DICE papers use DBpedia-Wikidata?” retain the existing kind-aware semantic and metadata-name retrieval. After reranking, duplicate excerpts are removed, at most 3 chunks per paper are kept, and up to 6 sources are passed to the LLM. Recognized single-paper queries intentionally allow up to 5 chunks from that paper. These limits are defined in `scripts/rag/run-rag.mjs`; no re-ingestion is required for retrieval changes.

```text
TTL paper
  ↓ pdfUrl, otherwise url

ingest-papers.mjs
  ↓
download PDF
  ↓
extract + chunk
  ↓
MiniLM embeddings
  ↓
Qdrant
    ├── kind=paper
    └── kind=paper_chunk

                     USER QUESTION
                           ↓
                  recognize paper
                           ↓
                       MiniLM
                           ↓
          Qdrant top 10 (scoped or global)
                           ↓
         dedupe: 5 scoped / 6 global sources
         global: at most 3 chunks per paper
                     ↙          ↘
             normal entity    paper_chunk
                  ↓                ↓
           entities.json       payload.text
                     ↘          ↙
                     LLM context
                           ↓
                         answer
```