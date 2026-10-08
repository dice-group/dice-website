import 'dotenv/config';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runRag } from './run-rag.mjs';

const PORT = Number(process.env.RAG_PORT || 8787);
const deployment = process.env.RAG_DEPLOYMENT_ID || 'local';
const ingestionReport = path.join(
  tmpdir(),
  `dice-ingestion-${randomUUID()}.json`
);
let ingestionStatus =
  process.env.RAG_INGEST_PAPERS === '1' ? 'running' : 'disabled';

function getIngestionReport() {
  let report = {};
  try {
    report = JSON.parse(readFileSync(ingestionReport, 'utf8'));
  } catch {}
  return {
    ...report,
    deployment,
    status:
      ingestionStatus === 'failed'
        ? 'failed'
        : report.status || ingestionStatus,
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
  });

  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    });

    res.end();
    return;
  }

  if (
    req.method === 'GET' &&
    ['/health', '/api/rag/health'].includes(req.url)
  ) {
    sendJson(res, 200, {
      status: 'ok',
      deployment,
    });

    return;
  }

  if (req.method === 'GET' && req.url === '/api/rag/ingestion') {
    sendJson(res, 200, getIngestionReport());
    return;
  }

  if (req.method === 'POST' && req.url === '/api/rag') {
    try {
      let body = '';

      for await (const chunk of req) {
        body += chunk;
      }

      const data = JSON.parse(body || '{}');

      const question =
        typeof data.question === 'string' ? data.question.trim() : '';

      if (!question) {
        sendJson(res, 400, {
          error: 'question is required',
        });

        return;
      }

      console.log(`RAG query: ${question}`);

      const result = await runRag(question);

      sendJson(res, 200, result);
    } catch (error) {
      console.error(error);

      sendJson(res, 500, {
        error: 'RAG request failed',
      });
    }

    return;
  }

  sendJson(res, 404, {
    error: 'Not found',
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`RAG API listening on http://127.0.0.1:${PORT}`);
  if (ingestionStatus === 'disabled') return;
  const stateDir =
    process.env.RAG_INGESTION_STATE_DIR || './data/rag/ingestion';
  mkdirSync(stateDir, { recursive: true });
  // flock is released by the OS on termination; no stale lock-file recovery.
  // The shared volume also serializes old/new containers during a rollout.
  const child = spawn(
    'flock',
    [
      '--exclusive',
      path.join(stateDir, 'ingestion.lock'),
      process.execPath,
      fileURLToPath(new URL('./ingest-papers.mjs', import.meta.url)),
    ],
    {
      stdio: 'inherit',
      env: { ...process.env, RAG_INGESTION_REPORT: ingestionReport },
    }
  );
  child.on('error', error => {
    ingestionStatus = 'failed';
    console.error('Cannot launch paper ingestion:', error);
  });
  child.on('exit', code => {
    ingestionStatus = code === 0 ? 'complete' : 'failed';
  });
});
