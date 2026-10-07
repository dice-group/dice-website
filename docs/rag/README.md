# Runtime flow

```text
user query
→ MiniLM embedding
→ Qdrant
→ top 3
→ Gatsby GraphQL enrichment
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

Retrieval unit: one primary RDF resource represented by one TTL file / RDF subject. Generate type-specific human-readable embedding text from selected semantic properties. Preserve the URI and entity type as vector metadata. Relationships are resolved/enriched through GraphQL at query time rather than expanded fully into the embedding document.

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
No. Qdrant finds relevant entities, then Gatsby GraphQL enriches them with current RDF data before the LLM generates the answer.

**Is all RDF data embedded?**  
No. Only useful human-readable fields such as names, descriptions, roles, projects, authors, members, tags, and similar metadata are embedded.

**How is the RAG index updated?**  
The documents, embeddings, and Qdrant collection are regenerated when the website data is updated.

**How are sources shown?**  
The answer includes links back to the relevant DICE website pages.