import React from 'react';

export default ({ data }) => (
  <>
    <style jsx>{`
      .card {
        margin-top: 10px;
      }

      .tag {
        margin-left: 5px;
      }
    `}</style>
    <div className="card" key={data.id}>
      <header className="card-header">
        <p className="card-header-title">
          {data.title}
          <span className="tag is-rounded is-black">{data.type}</span>
        </p>
        {data.pdfUrl && (
          <a
            href={data.pdfUrl}
            className="card-header-icon"
            aria-label="Download PDF"
          >
            <span className="icon">
              <i className="fas fa-download" aria-hidden="true" />
            </span>
          </a>
        )}
      </header>

      <div className="card-content">
        {data.authorName && (
          <p>
            <i>Authors</i>: {data.authorName.join(', ')}
          </p>
        )}
        <p>
          <i>Published in</i>: {data.source || ''}
        </p>
        <p>
          <i>Publication date</i>: {data.year}
        </p>
        {data.tag && (
          <p>
            <i>Tags</i>:{' '}
            {data.tag.map(tag => (
              <span key={tag} className="tag is-rounded">
                {tag}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  </>
);
