export class RagError extends Error {
  constructor(code, message, status = 502, cause) {
    super(message, { cause });
    this.code = code;
    this.status = status;
  }
}

export async function ragStage(stage, operation) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RagError) throw error;
    const status = Number(error.status || error.statusCode);
    const name = error.name || '';
    const code = error.code || error.cause?.code || '';
    const label =
      stage === 'llm'
        ? 'The answer-generation service (LLM)'
        : stage === 'retrieval'
        ? 'The search index'
        : 'The question-embedding service';
    let reason = 'failed unexpectedly. Please try again.';
    let suffix = 'FAILED';
    let httpStatus = 502;
    if (
      /Timeout|Abort/.test(name) ||
      /TIMEOUT|TIMEDOUT/.test(code) ||
      status === 504 ||
      status === 408
    ) {
      reason = 'timed out. Please try again.';
      suffix = 'TIMEOUT';
      httpStatus = 504;
    } else if (status === 401 || status === 403) {
      reason =
        'rejected the server credentials or access permissions. The site administrator needs to check the service configuration.';
      suffix = 'AUTH';
    } else if (status === 429) {
      reason =
        'reported a rate or quota limit. Try again later; if this persists, contact the site administrator.';
      suffix = 'RATE_LIMIT';
      httpStatus = 503;
    } else if (status >= 500) {
      reason = 'is temporarily unavailable. Please try again later.';
      suffix = 'UNAVAILABLE';
      httpStatus = 503;
    } else if (
      /Connection/.test(name) ||
      ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(code) ||
      error.message === 'fetch failed'
    ) {
      reason = 'could not be reached by the server. Please try again later.';
      suffix = 'CONNECTION';
      httpStatus = 503;
    } else if (status >= 400 && status < 500) {
      reason = `rejected the request (HTTP ${status}). The site administrator needs to check the service configuration.`;
      suffix = 'REQUEST';
    }
    throw new RagError(
      `${stage.toUpperCase()}_${suffix}`,
      `${label} ${reason}`,
      httpStatus,
      error
    );
  }
}

export function publicRagError(error, requestId) {
  return {
    status: error instanceof RagError ? error.status : 500,
    body: {
      error:
        error instanceof RagError
          ? error.message
          : 'The server could not complete your question. Please try again; if this persists, contact the site administrator with the request ID.',
      code: error instanceof RagError ? error.code : 'RAG_INTERNAL',
      requestId,
    },
  };
}
