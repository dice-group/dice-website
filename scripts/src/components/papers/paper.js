import React from 'react';
import ExternalLink from '../externalLink';

const Paper = ({
  data: {
    source,
    title,
    year,
    publicationType,
    authorName,
    pdfUrl,
    bibsonomyId,
  },
}) => (
  <div className="paper">
    <p className="paper-text">{source}</p>
    <h3 className="paper-name">
      {pdfUrl ? <ExternalLink to={pdfUrl}>{title}</ExternalLink> : title}
    </h3>
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
