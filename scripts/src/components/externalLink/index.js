import React from 'react';
import { FaExternalLinkAlt, FaFilePdf } from 'react-icons/fa';

export default function ExternalLink({
  to,
  kind = 'link',
  children,
  className = '',
  showIcon = true,
  ...rest
}) {
  const Icon = kind === 'link' ? FaExternalLinkAlt : FaFilePdf;
  const isHttp = /^https?:\/\//i.test(String(to));
  const cls = ['external-link', className].filter(Boolean).join(' ');

  return (
    <a
      className={cls}
      href={to}
      {...(isHttp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children} {showIcon && <Icon className="icon" />}
    </a>
  );
}
