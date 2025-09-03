import React, { useEffect, useState } from 'react';
import fetch from 'isomorphic-unfetch';

const Embed = ({ urn }) => (
  <div className="mb-5">
    <iframe
      title={urn}
      src={`https://www.linkedin.com/embed/feed/update/${encodeURIComponent(
        urn
      )}`}
      width="100%"
      height="650"
      loading="lazy"
      allowFullScreen
      style={{ maxWidth: 720 }}
    />
  </div>
);

export default function LinkedInFeed() {
  const [urns, setUrns] = useState([]);
  useEffect(() => {
    fetch('/data/linkedin.json')
      .then(r => r.json())
      .then(j => setUrns(j.urns || []))
      .catch(() => setUrns([]));
  }, []);
  return urns.length ? (
    <div className="content">
      {urns.map(u => (
        <Embed key={u} urn={u} />
      ))}
    </div>
  ) : (
    <p>
      Visit our LinkedIn page:{' '}
      <a
        href="https://www.linkedin.com/company/88654324"
        target="_blank"
        rel="noreferrer"
      >
        DICE Research on LinkedIn
      </a>
    </p>
  );
}
