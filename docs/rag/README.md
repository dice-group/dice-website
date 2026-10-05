```text
Question
   ↓
semantic entity retrieval
   ↓
KG neighborhood expansion
   ↓
GraphQL
   ↓
LLM
```

# Runtime flow

```text
User types a question in Gatsby
        ↓
POST /api/rag
        ↓
Create embedding for the question
        ↓
Search vector DB for top 5 relevant entities
        ↓
Get their URIs
        ↓
Use those URIs in GraphQL
        ↓
Fetch structured facts / relations for those entities
        ↓
Build compact context
        ↓
Send question + context to LLM
        ↓
Return:
  - answer
  - source entities
  - Gatsby page links
        ↓
Render answer in Gatsby
```

# One TTL object's main RDF resource = one vector document.

Retrieval unit: one primary RDF resource represented by one TTL file / RDF subject. Generate type-specific human-readable embedding text from selected semantic properties. Preserve the URI and entity type as vector metadata. Relationships are resolved/enriched through GraphQL at query time rather than expanded fully into the embedding document.

```sh
npm run rag:documents
```

# Qdrant for embeddings

```sh
npm run rag:embed
npm run rag:search -- "scalable RDF data integration"
```