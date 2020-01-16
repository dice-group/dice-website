import React from 'react';
import ExternalLink from '../externalLink';

const renderTitle = ({ title, url, pdfUrl }) => {
  if (pdfUrl) {
    return <ExternalLink to={pdfUrl}>{title}</ExternalLink>;
  }
  if (url) {
    return <ExternalLink to={url}>{title}</ExternalLink>;
  }

  return title;
};

const Paper = ({
  data: {
    source,
    title,
    year,
    publicationType,
    authorName,
    url,
    pdfUrl,
    bibsonomyId,
  },
}) => (
  <div className="paper">
    <p className="paper-text">{source}</p>
    <h3 className="paper-name">{renderTitle({ title, url, pdfUrl })}</h3>
    <p className="paper-meta">By {(authorName || []).join(', ')}</p>
    <p className="paper-meta">
      {year}, #{publicationType}{' '}
      <a className="bib-link" href={bibsonomyId}>
        Get BibTex
      </a>
    </p>
  </div>
);

export default Paper;
