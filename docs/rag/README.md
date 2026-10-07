# Runtime flow

```text
user query
→ MiniLM embedding
→ Qdrant
→ top 3
→ Local entity store enrichment
→ cleaned context
→ LLM
→ final answer
```

# The RAG index currently contains these entity types:

- person
- paper
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
No. Qdrant finds relevant entities, then the local entity store enriches them with RDF data before the LLM generates the answer.

**Is all RDF data embedded?**  
No. Only useful human-readable fields such as names, descriptions, roles, projects, authors, members, tags, and similar metadata are embedded.

**How is the RAG index updated?**  
The documents, embeddings, and Qdrant collection are regenerated when the website data is updated.

**How are sources shown?**  
The answer includes links back to the relevant DICE website pages.

## Production entity store

From `scripts/`, generate the store with:

```sh
npm run rag:entities
```

This reads TTL files (excluding examples, `papers_all`, and generated RAG data), resolves relationship names and roles, and precomputes project staff excluding alumni. Output is written atomically to `data/rag/entities.json`. Project paths follow the Gatsby RDF transformer: for example, `/TRR318_INF`.

`npm run build` regenerates the store through `prebuild`, including weekly builds. When updating the RAG index, regenerate this store from the same TTL snapshot. No Gatsby development server or runtime RDF parser is needed.

Deploy `entities.json` alongside the Node RAG service. The existing static website deployment does not deploy this service or its data. The default location is `data/rag/entities.json` relative to the repository; for a separate service deployment use:

```sh
RAG_ENTITY_STORE=/srv/dice-rag/entities.json npm run rag:server
```

Restart the RAG server after replacing the store: it is loaded once at startup. Missing or invalid files stop startup with a generation hint; missing indexed entities fail the query with a regeneration hint instead of silently losing enrichment. `GRAPHQL_URL` is no longer used by `run-rag.mjs` (the standalone legacy enrichment diagnostic still uses it).
