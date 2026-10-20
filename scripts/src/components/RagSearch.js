import React, { useState } from 'react';
import fetch from 'isomorphic-unfetch';
import Paper from './papers/paper';
import PersonInfo from './personInfo';
import RagAnswer from './RagAnswer';
import './styles/rag-search.css';

export default function RagSearch() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();

    if (loading || !question.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    const controller = new window.AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let endpoint = '';

    try {
      const apiUrl = new URL('/api/rag', window.location.href);
      // Local/LAN preview uses the API port; HTTPS deployments use a proxy.
      if (apiUrl.protocol === 'http:') apiUrl.port = '8787';
      endpoint = process.env.GATSBY_RAG_API_URL || apiUrl.toString();
      const response = await fetch(endpoint, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          `The RAG server returned an unreadable response (HTTP ${
            response.status
          }). ${
            response.status === 504
              ? 'The gateway timed out; the failing stage is unknown.'
              : 'The server or gateway may be unavailable. Please try again later.'
          }`
        );
      }

      if (!response.ok) {
        throw new Error(
          `${
            data?.error || `The RAG request failed (HTTP ${response.status}).`
          }${data?.requestId ? ` Request ID: ${data.requestId}` : ''}`
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? 'No answer arrived within 45 seconds. The failing stage is unknown: ' +
              'search, answer generation, or the connection may be slow. Please try again.'
          : err instanceof TypeError
          ? 'Could not connect to the RAG server. Check your connection and try again. ' +
            'The server may be offline or the browser may have blocked the connection.'
          : err.message
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="rag-search">
      <h2 id="ask-title" className="title">
        Ask DICE
      </h2>
      <p id="ask-description" className="rag-search-description">
        Explore our research. Ask a question about projects, publications or
        people.
      </p>
      <form onSubmit={submit} className="rag-search-form">
        <div className="rag-search-field">
          <label htmlFor="rag-question">Your question</label>
          <input
            id="rag-question"
            className="input papers-filter"
            type="text"
            value={question}
            onChange={event => setQuestion(event.target.value)}
            placeholder="e.g. Which projects work on entity linking?"
            aria-describedby="ask-description"
            required
          />
        </div>
        <button
          className="action-button"
          type="submit"
          disabled={loading || !question.trim()}
        >
          {loading ? 'Searching…' : 'Ask DICE'}
        </button>
      </form>

      <div role="status" aria-live="polite" aria-atomic="true">
        {loading && (
          <p className="rag-search-loading">
            <span className="rag-search-spinner" aria-hidden="true" />
            Searching the DICE website…
          </p>
        )}
      </div>
      {error && (
        <p className="rag-search-error" role="alert">
          {error}
        </p>
      )}

      <div aria-live="polite" aria-busy={loading}>
        {result && (
          <div className="rag-search-result">
            <h3 className="rag-search-heading">Answer</h3>
            <RagAnswer answer={result.answer} />
            {result.sources?.length > 0 && (
              <div className="rag-search-sources">
                <h3 className="rag-search-heading">Sources</h3>
                <ul>
                  {result.sources.map(source => (
                    <li
                      key={source.chunkId || source.uri}
                      className={
                        ['paper', 'paper_chunk'].includes(source.kind) &&
                        source.paper
                          ? 'rag-search-paper'
                          : source.kind === 'person' && source.person
                          ? 'rag-search-person'
                          : undefined
                      }
                    >
                      {['paper', 'paper_chunk'].includes(source.kind) &&
                      source.paper ? (
                        <>
                          <Paper data={source.paper} />
                          {source.pages && source.pdfUrl && (
                            <div>
                              PDF pages{' '}
                              {source.pageRanges.map((range, index) => (
                                <React.Fragment
                                  key={`${range.start}-${range.end}`}
                                >
                                  {index > 0 && ', '}
                                  <a
                                    href={`${
                                      source.pdfUrl.split('#')[0]
                                    }#page=${range.start}`}
                                  >
                                    {range.start === range.end
                                      ? range.start
                                      : `${range.start}–${range.end}`}
                                  </a>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                          {source.sections?.length > 0 && (
                            <div>Sections: {source.sections.join('; ')}</div>
                          )}
                          {source.kind === 'paper_chunk' && source.pdfUrl && (
                            <a
                              href={`${source.pdfUrl.split('#')[0]}#page=${
                                source.pageStart
                              }`}
                            >
                              PDF pages {source.pageStart}–{source.pageEnd}
                              {source.subsection || source.section
                                ? ` · ${source.subsection || source.section}`
                                : ''}
                            </a>
                          )}
                        </>
                      ) : source.kind === 'person' && source.person ? (
                        <>
                          <PersonInfo data={source.person} />
                          <a href={source.path || source.uri}>
                            View full profile<span aria-hidden="true"> ↗</span>
                          </a>
                        </>
                      ) : (
                        <>
                          <a href={source.path || source.uri}>
                            {source.name || source.uri}
                            <span aria-hidden="true"> ↗</span>
                          </a>
                          {source.kind && (
                            <span className="rag-search-kind">
                              {source.kind}
                            </span>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
