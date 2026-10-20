import test from 'node:test';
import assert from 'node:assert/strict';
import { RagError, ragStage, publicRagError } from './errors.mjs';

for (const [stage, upstream, code, status] of [
  ['llm', { status: 401 }, 'LLM_AUTH', 502],
  ['llm', { status: 403 }, 'LLM_AUTH', 502],
  ['llm', { status: 429 }, 'LLM_RATE_LIMIT', 503],
  ['llm', { status: 503 }, 'LLM_UNAVAILABLE', 503],
  ['llm', { name: 'APIConnectionTimeoutError' }, 'LLM_TIMEOUT', 504],
  ['llm', { name: 'APIConnectionError' }, 'LLM_CONNECTION', 503],
  ['llm', { status: 400 }, 'LLM_REQUEST', 502],
  [
    'retrieval',
    { cause: { code: 'ECONNREFUSED' } },
    'RETRIEVAL_CONNECTION',
    503,
  ],
  ['retrieval', { status: 404 }, 'RETRIEVAL_REQUEST', 502],
  ['embedding', {}, 'EMBEDDING_FAILED', 502],
]) {
  test(`maps ${code} without exposing upstream details`, async () => {
    const original = Object.assign(
      new Error('private provider detail'),
      upstream
    );
    await assert.rejects(
      ragStage(stage, () => {
        throw original;
      }),
      error => {
        assert.equal(error.cause, original);
        const failure = publicRagError(error, 'test-request');
        assert.equal(failure.status, status);
        assert.equal(failure.body.code, code);
        assert.equal(failure.body.requestId, 'test-request');
        assert.doesNotMatch(JSON.stringify(failure), /private provider detail/);
        return true;
      }
    );
  });
}

test('preserves explicit LLM output failures', async () => {
  const original = new RagError(
    'LLM_INVALID_JSON',
    'LLM returned invalid answer JSON.'
  );
  await assert.rejects(
    ragStage('llm', () => {
      throw original;
    }),
    error => error === original
  );
});

test('passes successful results through', async () => {
  assert.equal(await ragStage('llm', async () => 'answer'), 'answer');
});

test('unexpected errors receive a safe message and request ID', () => {
  const failure = publicRagError(new Error('secret'), 'request-123');
  assert.equal(failure.status, 500);
  assert.equal(failure.body.code, 'RAG_INTERNAL');
  assert.equal(failure.body.requestId, 'request-123');
  assert.doesNotMatch(JSON.stringify(failure), /secret/);
});
