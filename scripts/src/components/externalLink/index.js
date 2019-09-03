import React from 'react';
import { FaExternalLinkAlt, FaFilePdf } from 'react-icons/fa';

export default function ExternalLink({ to, kind = 'link', children }) {
  const Icon = kind === 'link' ? FaExternalLinkAlt : FaFilePdf;
  return (
    <a className="external-link" href={to}>
      {children} <Icon className="icon" />
    </a>
  );
}
