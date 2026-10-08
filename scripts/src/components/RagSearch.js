import React, { useState } from 'react';
import fetch from 'isomorphic-unfetch';
import Paper from './papers/paper';
import PersonInfo from './personInfo';
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResult(data);
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? `The request timed out. Check that the API at ${endpoint} is reachable from your browser and try again.`
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
            <div className="rag-search-answer">{result.answer}</div>
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
