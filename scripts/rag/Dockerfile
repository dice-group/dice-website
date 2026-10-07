FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    RAG_PORT=8787 \
    RAG_ENTITY_STORE=/app/data/rag/entities.json \
    RAG_MODEL_CACHE=/app/model-cache
COPY scripts/rag/docker/package.json scripts/rag/docker/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY scripts/rag/server.mjs scripts/rag/run-rag.mjs scripts/rag/ask-rag.mjs ./scripts/rag/
COPY data/rag/entities.json ./data/rag/entities.json
RUN mkdir -p /app/model-cache && chown node:node /app/model-cache
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=300s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.RAG_PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/rag/server.mjs"]
