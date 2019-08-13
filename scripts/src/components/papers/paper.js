import { Link } from 'gatsby';
import React from 'react';

const Authors = ({ authorName, author }) => {
  if (!authorName) {
    return '';
  }

  const authors = authorName.map(name => {
    const data = author.find(a => a.data.name === name);
    if (!data) {
      return (
        <li key={name}>
          <span>{name}</span>
        </li>
      );
    }

    return (
      <li key={name}>
        <Link to={data.path}>{name}</Link>
      </li>
    );
  });

  return (
    <div className="is-flex">
      <i>Authors</i>:
      <ul style={{ paddingLeft: 10 }} className="people-list">
        {authors}
      </ul>
    </div>
  );
};

const Paper = ({ data }) => (
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
          <span className="tag is-rounded is-black">
            {data.publicationType}
          </span>
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
        <Authors author={data.author} authorName={data.authorName} />
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

export default Paper;
