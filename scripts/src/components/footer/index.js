import { Link } from 'gatsby';
import React from 'react';

const links = [
  { url: '/imprint', text: 'Imprint' },
  { url: '/privacy', text: 'Privacy Policy' },
  { url: '/jobs', text: 'Jobs' },
];

const Footer = () => (
  <div className="content dice-footer">
    <div className="is-flex" style={{ justifyContent: 'space-evenly' }}>
      {links.map(l => (
        <Link key={l.url} to={l.url}>
          {l.text}
        </Link>
      ))}
      <a href="https://wikis.uni-paderborn.de/dice">DICE Wiki</a>
    </div>
  </div>
);

export default Footer;
