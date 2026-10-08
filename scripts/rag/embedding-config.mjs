// Keep ingestion and query vectors in the same embedding space.
export const EMBEDDING_MODEL =
  process.env.RAG_EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_REVISION = process.env.RAG_EMBEDDING_REVISION || 'main';
export const EMBEDDING_VERSION = `${EMBEDDING_MODEL}@${EMBEDDING_REVISION}`;
export const EMBEDDING_OPTIONS = {
  device: 'cpu',
  revision: EMBEDDING_REVISION,
};
