import 'dotenv/config';
import http from 'node:http';
import { runRag } from './run-rag.mjs';

const PORT = Number(process.env.RAG_PORT || 8787);

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

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, {
      status: 'ok',
    });

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
});
