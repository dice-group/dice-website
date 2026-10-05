import fs from "fs";
import readline from "readline";
import crypto from "crypto";
import { QdrantClient } from "@qdrant/js-client-rest";

const INPUT =
  process.argv[2] || "../data/rag/rag_embeddings.jsonl";

const QDRANT_URL =
  process.env.QDRANT_URL || "http://127.0.0.1:6333";

const COLLECTION =
  process.env.QDRANT_COLLECTION || "dice_rag";

const VECTOR_SIZE = 384;
const BATCH_SIZE = 100;

const client = new QdrantClient({
  url: QDRANT_URL,
});

function uriToUuid(uri) {
  const hash = crypto
    .createHash("sha256")
    .update(uri)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

async function ensureCollection() {
  const collections = await client.getCollections();

  const exists = collections.collections.some(
    (collection) => collection.name === COLLECTION
  );

  if (exists) {
    console.log(`Collection exists: ${COLLECTION}`);
    return;
  }

  console.log(`Creating collection: ${COLLECTION}`);

  await client.createCollection(COLLECTION, {
    vectors: {
      size: VECTOR_SIZE,
      distance: "Cosine",
    },
  });
}

async function upsertBatch(points) {
  if (!points.length) return;

  await client.upsert(COLLECTION, {
    wait: true,
    points,
  });

  console.log(`Upserted ${points.length} points`);
}

async function main() {
  console.log(`Qdrant: ${QDRANT_URL}`);
  console.log(`Collection: ${COLLECTION}`);
  console.log(`Input: ${INPUT}`);

  await ensureCollection();

  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT),
    crlfDelay: Infinity,
  });

  let batch = [];
  let total = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    const doc = JSON.parse(line);

    if (!Array.isArray(doc.embedding)) {
      console.warn(`Skipping without embedding: ${doc.id}`);
      continue;
    }

    if (doc.embedding.length !== VECTOR_SIZE) {
      throw new Error(
        `Wrong vector size for ${doc.id}: ` +
        `${doc.embedding.length}, expected ${VECTOR_SIZE}`
      );
    }

    batch.push({
      id: uriToUuid(doc.metadata.uri),

      vector: doc.embedding,

      payload: {
        uri: doc.metadata.uri,
        kind: doc.metadata.kind,
        name: doc.metadata.name,
        source: doc.metadata.source,
        contentHash: doc.metadata.contentHash,
        text: doc.text,
      },
    });

    if (batch.length >= BATCH_SIZE) {
      await upsertBatch(batch);
      total += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await upsertBatch(batch);
    total += batch.length;
  }

  console.log("");
  console.log(`Done.`);
  console.log(`Indexed ${total} documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});