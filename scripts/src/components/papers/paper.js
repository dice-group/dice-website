import React from 'react';
import ExternalLink from '../externalLink';

const renderTitle = ({ title, url, pdfUrl }) => {
  if (pdfUrl) {
    return (
      <ExternalLink to={pdfUrl} showIcon>
        {title}
      </ExternalLink>
    );
  }
  if (url) {
    return (
      <ExternalLink to={url} showIcon>
        {title}
      </ExternalLink>
    );
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
    doi,
    presentationUrl,
    videoUrl,
  },
}) => {
  const doiHref = doi
    ? `https://doi.org/${String(doi)
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
        .trim()}`
    : url && /doi\.org/i.test(url)
    ? url
    : null;

  const normalizeForCompare = href => {
    if (!href) return '';
    let s = String(href).trim();
    s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, 'https://doi.org/');
    s = s.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return s.toLowerCase();
  };
  const same = (a, b) => normalizeForCompare(a) === normalizeForCompare(b);
  const showDoiIcon = doiHref && !same(doiHref, url) && !same(doiHref, pdfUrl);

  const IconLink = ({ href, label, src }) =>
    href ? (
      <ExternalLink
        to={href}
        className="paper-icon"
        aria-label={label}
        title={label}
        showIcon={false}
      >
        <img src={src} alt="" loading="lazy" decoding="async" />
        <span className="sr-only">{label}</span>
      </ExternalLink>
    ) : null;

  return (
    <div className="paper paper--light">
      <h3 className="paper-name">{renderTitle({ title, url, pdfUrl })}</h3>

      <p className="paper-meta">By {(authorName || []).join(', ')}</p>

      <p className="paper-text">
        {source}, {year}
        {publicationType ? `, #${publicationType}` : ''}
      </p>

      <div className="paper-links">
        <IconLink
          href={pdfUrl}
          label="PDF"
          src="/images/publications/pdf.png"
        />
        <IconLink
          href={bibsonomyId}
          label="BibTeX"
          src="/images/publications/bib.png"
        />
        {showDoiIcon && (
          <IconLink
            href={doiHref}
            label="DOI"
            src="/images/publications/doi.png"
          />
        )}
        <IconLink
          href={presentationUrl}
          label="Presentation"
          src="/images/publications/presentation.png"
        />
        <IconLink
          href={videoUrl}
          label="Video"
          src="/images/publications/video.png"
        />
      </div>
    </div>
  );
};

export default Paper;
