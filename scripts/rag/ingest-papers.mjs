import { createHash } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import path from 'node:path';
import { env, pipeline } from '@huggingface/transformers';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  EMBEDDING_MODEL,
  EMBEDDING_OPTIONS,
  EMBEDDING_VERSION,
} from './embedding-config.mjs';
import {
  PIPELINE_VERSION,
  requirePdfTools,
  downloadPdf,
  extractPdf,
  chunkPdf,
  embedPdfChunk,
} from './pdf-chunks.mjs';

// The deployment launcher holds a filesystem flock for the entire run. Manual
// invocations must use that same lock (see docs/rag/README.md).
const collection = process.env.QDRANT_COLLECTION || 'dice_rag';
const url = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
const client = new QdrantClient({ url, apiKey: process.env.QDRANT_API_KEY });
const hash = value => createHash('sha256').update(value).digest('hex');
function pointId(value) {
  const h = hash(value);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(
    16,
    20
  )}-${h.slice(20, 32)}`;
}
const stateDir = process.env.RAG_INGESTION_STATE_DIR || './data/rag/ingestion';
mkdirSync(stateDir, { recursive: true });
const stateFile = path.join(stateDir, `${hash(`${url}/${collection}`)}.json`);
const reportFile =
  process.env.RAG_INGESTION_REPORT || path.join(stateDir, 'report.json');
const report = {
  status: 'running',
  deployment: process.env.RAG_DEPLOYMENT_ID || 'local',
  startedAt: new Date().toISOString(),
  papersFound: 0,
  withPdfUrl: 0,
  alreadyUnchanged: 0,
  newPdfs: 0,
  changedPdfs: 0,
  reprocessedPdfs: 0,
  failedPdfs: 0,
  chunksAdded: 0,
  chunksRemoved: 0,
  metadataUpdated: 0,
  papersRemoved: 0,
};
function atomicJson(filename, value) {
  mkdirSync(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  renameSync(temporary, filename);
}
const eq = (key, value) => ({ key, match: { value } });
const paperFilter = paperUri => ({
  must: [eq('kind', 'paper_chunk'), eq('paperUri', paperUri)],
});

// Some Turtle records publish the PDF under url instead of pdfUrl. Validate
// the downloaded content rather than requiring a .pdf filename extension.
function paperPdfUrl(paper) {
  return paper?.data?.pdfUrl?.trim() || paper?.data?.url?.trim() || null;
}

async function main() {
  const entities = JSON.parse(
    readFileSync(
      process.env.RAG_ENTITY_STORE ||
        new URL('../../data/rag/entities.json', import.meta.url),
      'utf8'
    )
  );
  const papers = Object.values(entities).filter(
    entity => entity.kind === 'paper'
  );
  if (
    Object.values(entities).some(
      entity => entity.id?.includes('/papers/') && entity.kind !== 'paper'
    )
  )
    throw new Error(
      'Outdated entity store. Regenerate it with npm run rag:entities before ingestion.'
    );
  const current = new Map(papers.map(paper => [paper.id, paper]));
  report.papersFound = papers.length;
  report.withPdfUrl = papers.filter(paper => paperPdfUrl(paper)).length;
  atomicJson(reportFile, report);

  // Missing local tools are a fatal setup error, not a failure of every PDF.
  // Check before model loading, network downloads, or any Qdrant mutations.
  if (report.withPdfUrl > 0) await requirePdfTools();

  if (process.env.RAG_MODEL_CACHE) env.cacheDir = process.env.RAG_MODEL_CACHE;
  env.backends.onnx.wasm.numThreads = 1;
  const extractor = await pipeline(
    'feature-extraction',
    EMBEDDING_MODEL,
    EMBEDDING_OPTIONS
  );
  const embed = async text => {
    const tensor = await extractor(text, { pooling: 'mean', normalize: true });
    const vector = tensor.tolist()[0];
    if (!vector.length || !vector.every(Number.isFinite))
      throw new Error('Embedding produced an invalid vector');
    return vector;
  };
  const dimensions = (await embed('embedding dimensions')).length;
  const collections = await client.getCollections();
  if (!collections.collections.some(item => item.name === collection)) {
    await client.createCollection(collection, {
      vectors: { size: dimensions, distance: 'Cosine' },
    });
  }
  const info = await client.getCollection(collection);
  if (info.config.params.vectors?.size !== dimensions)
    throw new Error(
      'Embedding dimensions differ from Qdrant. Use a new collection and rebuild all entity embeddings.'
    );
  for (const key of ['kind', 'paperUri', 'generation']) {
    await client.createPayloadIndex(collection, {
      field_name: key,
      field_schema: 'keyword',
      wait: true,
    });
  }

  const state = existsSync(stateFile)
    ? JSON.parse(readFileSync(stateFile, 'utf8'))
    : { version: 1, papers: {} };
  if (state.version !== 1 || !state.papers)
    throw new Error('Unsupported or damaged paper ingestion state');
  const save = () => atomicJson(stateFile, state);
  // Reconcile against actual Qdrant points, including interrupted runs and a
  // restored/empty database. A local state entry alone is never enough to skip.
  const existing = new Map();
  const metadata = new Map();
  let offset;
  do {
    const result = await client.scroll(collection, {
      limit: 256,
      offset,
      with_vector: false,
      with_payload: [
        'kind',
        'uri',
        'paperUri',
        'generation',
        'contentHash',
        'embeddingModel',
      ],
      filter: {
        must: [{ key: 'kind', match: { any: ['paper', 'paper_chunk'] } }],
      },
    });
    for (const point of result.points) {
      if (point.payload.kind === 'paper')
        metadata.set(point.payload.uri, point);
      else {
        const uri = point.payload.paperUri;
        if (!uri)
          throw new Error(
            'paper_chunk is missing paperUri; repair it before ingestion'
          );
        if (!existing.has(uri)) existing.set(uri, []);
        existing.get(uri).push(point);
      }
    }
    offset = result.next_page_offset;
  } while (offset != null);

  // Never infer deletion from a download failure: membership comes solely from
  // the complete, strictly parsed Turtle-derived snapshot.
  for (const uri of new Set([
    ...existing.keys(),
    ...Object.keys(state.papers),
  ])) {
    if (paperPdfUrl(current.get(uri))) continue;
    await client.delete(collection, { wait: true, filter: paperFilter(uri) });
    report.chunksRemoved += existing.get(uri)?.length || 0;
    report.papersRemoved++;
    delete state.papers[uri];
    save();
  }
  for (const [uri, point] of metadata) {
    if (current.has(uri)) continue;
    await client.delete(collection, { wait: true, points: [point.id] });
  }

  for (const paper of papers) {
    const paperUri = paper.id;
    const title = paper.data.title || paper.data.name || paperUri;
    const pdfUrl = paperPdfUrl(paper);
    const text = [
      'Type: Publication',
      `Title: ${title}`,
      `Authors: ${(paper.data.authorName || []).join(', ')}`,
      `Published in: ${paper.data.source || ''}`,
      `Year: ${paper.data.year || ''}`,
      `Keywords: ${(paper.data.tag || []).join(', ')}`,
    ].join('\n');
    const contentHash = hash(text);
    // Metadata has its own point and identity. It is never removed by the
    // paper_chunk replacement filter and remains useful when a PDF fails.
    const oldMetadata = metadata.get(paperUri)?.payload;
    if (
      oldMetadata?.contentHash !== contentHash ||
      oldMetadata?.embeddingModel !== EMBEDDING_VERSION
    ) {
      await client.upsert(collection, {
        wait: true,
        points: [
          {
            id: pointId(paperUri),
            vector: await embed(text),
            payload: {
              uri: paperUri,
              kind: 'paper',
              name: title,
              title,
              contentHash,
              embeddingModel: EMBEDDING_VERSION,
              text,
            },
          },
        ],
      });
      report.metadataUpdated++;
    }
    if (!pdfUrl) continue;
    try {
      const bytes = await downloadPdf(pdfUrl);
      const pdfHash = hash(bytes);
      const previous = state.papers[paperUri];
      const generation = hash(
        JSON.stringify({
          paperUri,
          title,
          pdfUrl,
          pdfHash,
          pipelineVersion: PIPELINE_VERSION,
          embeddingModel: EMBEDDING_VERSION,
        })
      );
      const oldPoints = existing.get(paperUri) || [];
      const complete =
        previous?.generation === generation &&
        previous.chunkCount > 0 &&
        oldPoints.length === previous.chunkCount &&
        oldPoints.every(point => point.payload.generation === generation);
      if (complete) {
        report.alreadyUnchanged++;
        continue;
      }
      const chunks = await chunkPdf(
        await extractPdf(bytes),
        extractor.tokenizer
      );
      const points = [];
      // Finish ALL extraction/chunking/embedding before changing this paper.
      for (const chunk of chunks) {
        const chunkId = hash(
          JSON.stringify([paperUri, generation, chunk.chunkIndex, chunk.text])
        );
        points.push({
          id: pointId(chunkId),
          vector: await embedPdfChunk(chunk, extractor),
          payload: {
            ...chunk,
            kind: 'paper_chunk',
            uri: paperUri,
            parentId: paperUri,
            paperUri,
            name: title,
            title,
            pdfUrl,
            pdfHash,
            chunkId,
            generation,
            pipelineVersion: PIPELINE_VERSION,
            embeddingModel: EMBEDDING_VERSION,
            chunkCount: chunks.length,
          },
        });
      }
      // Generation-specific IDs preserve the old complete set on a failed
      // upload. Retries overwrite any partial new set deterministically.
      const oldIds = new Set(oldPoints.map(point => String(point.id)));
      for (let start = 0; start < points.length; start += 64) {
        const batch = points.slice(start, start + 64);
        await client.upsert(collection, { wait: true, points: batch });
        report.chunksAdded += batch.filter(
          point => !oldIds.has(String(point.id))
        ).length;
      }
      await client.delete(collection, {
        wait: true,
        filter: {
          ...paperFilter(paperUri),
          must_not: [eq('generation', generation)],
        },
      });
      report.chunksRemoved += oldPoints.filter(
        point => point.payload.generation !== generation
      ).length;
      state.papers[paperUri] = {
        paperUri,
        pdfUrl,
        pdfHash,
        generation,
        pipelineVersion: PIPELINE_VERSION,
        embeddingModel: EMBEDDING_VERSION,
        chunkCount: chunks.length,
        updatedAt: new Date().toISOString(),
      };
      save();
      if (!previous) report.newPdfs++;
      else if (previous.pdfHash !== pdfHash) report.changedPdfs++;
      else report.reprocessedPdfs++;
    } catch (error) {
      report.failedPdfs++;
      console.warn(
        `PDF ingestion failed for ${paperUri} (${pdfUrl}): ${error.message}`
      );
      if (process.env.RAG_PDF_STRICT === '1') throw error;
    } finally {
      atomicJson(reportFile, report);
    }
  }
  report.status = 'complete';
}

try {
  await main();
} catch (error) {
  report.status = 'failed';
  console.error('Paper ingestion failed:', error);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  atomicJson(reportFile, report);
  console.log('Paper ingestion report:\n' + JSON.stringify(report, null, 2));
}
