import React from 'react';

const Paper = ({
  data: { source, title, year, publicationType, authorName, pdfUrl },
}) => (
  <div className="paper">
    <p className="text">{source}</p>
    <h3 className="name">{pdfUrl ? <a href={pdfUrl}>{title}</a> : title}</h3>
    <p className="meta">By {(authorName || []).join(', ')}</p>
    <p className="meta">
      {year}, #{publicationType}
    </p>
  </div>
);

export default Paper;
