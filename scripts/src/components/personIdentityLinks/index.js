import React from 'react';
import { FaExternalLinkAlt, FaOrcid } from 'react-icons/fa';
import { SiDblp, SiGooglescholar } from 'react-icons/si';

const providers = [
  {
    label: 'ORCID',
    icon: FaOrcid,
    className: 'orcid',
    matches: hostname => hostname === 'orcid.org',
  },
  {
    label: 'Google Scholar',
    icon: SiGooglescholar,
    className: 'google-scholar',
    matches: hostname => hostname.startsWith('scholar.google.'),
  },
  {
    label: 'DBLP',
    icon: SiDblp,
    className: 'dblp',
    matches: hostname =>
      hostname === 'dblp.org' || hostname.endsWith('.dblp.org'),
  },
];

const fallbackProvider = {
  label: 'External profile',
  icon: FaExternalLinkAlt,
  className: 'external',
};

const getProvider = url => {
  try {
    const { hostname } = new URL(url);
    const index = providers.findIndex(provider => provider.matches(hostname));

    if (index !== -1) {
      return { ...providers[index], order: index };
    }
  } catch {
    // Invalid URLs use the generic external-profile presentation.
  }

  return { ...fallbackProvider, order: providers.length };
};

export default function PersonIdentityLinks({ links = [], name }) {
  if (!links || links.length === 0) {
    return null;
  }

  const identityLinks = links
    .map(url => ({ url, provider: getProvider(url) }))
    .sort((a, b) => a.provider.order - b.provider.order);

  return (
    <span
      className="person-identity-links"
      role="group"
      aria-label={`${name} research profiles`}
    >
      {identityLinks.map(({ url, provider }) => {
        const Icon = provider.icon;

        return (
          <a
            className={`person-identity-link person-identity-link--${provider.className}`}
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} on ${provider.label}`}
            title={provider.label}
          >
            <Icon size={21} aria-hidden="true" />
          </a>
        );
      })}
    </span>
  );
}
