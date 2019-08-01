import { Link } from 'gatsby';
import React from 'react';
import Social from '../social';

const links = [
  { url: '/imprint', text: 'Imprint' },
  { url: '/privacy', text: 'Privacy Policy' },
];

const Footer = () => (
  <div className="footer">
    <div className="content is-flex dice-footer">
      <Social style={{ minWidth: 250, maxWidth: 250 }} />
      <div>
        {links.map(l => (
          <React.Fragment key={l.url}>
            <Link to={l.url}>{l.text}</Link>
            <span> • </span>
          </React.Fragment>
        ))}
        <a href="https://wikis.uni-paderborn.de/dice">DICE Wiki</a>
      </div>
    </div>
  </div>
);

export default Footer;
