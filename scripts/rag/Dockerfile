FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    RAG_PORT=8787 \
    RAG_ENTITY_STORE=/app/data/rag/entities.json \
    RAG_MODEL_CACHE=/app/model-cache \
    RAG_INGESTION_STATE_DIR=/app/model-cache/ingestion \
    RAG_INGEST_PAPERS=1
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils util-linux \
    && rm -rf /var/lib/apt/lists/*
COPY scripts/rag/docker/package.json scripts/rag/docker/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY scripts/rag/server.mjs scripts/rag/run-rag.mjs scripts/rag/ask-rag.mjs ./scripts/rag/
COPY scripts/rag/embedding-config.mjs scripts/rag/ingest-papers.mjs scripts/rag/pdf-chunks.mjs ./scripts/rag/
COPY data/rag/entities.json ./data/rag/entities.json
RUN mkdir -p /app/model-cache && chown node:node /app/model-cache
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=300s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.RAG_PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/rag/server.mjs"]
