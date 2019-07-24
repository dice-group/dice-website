import { Link } from 'gatsby';
import React, { useState } from 'react';
import DICE from '../svgs/dice.inline.svg';
import UPB from '../svgs/upb.inline.svg';
import styles from './header.module.css';

const links = [
  { url: '/', text: 'About' },
  { url: '/awards/', text: 'Awards' },
  { url: '/team/', text: 'Team' },
  { url: '/projects/', text: 'Projects' },
  { url: '/demos/', text: 'Demos' },
  { url: '/publications/', text: 'Publications' },
  { url: '/news/', text: 'News' },
  { url: '/theses/', text: 'Theses' },
  { url: '/teaching/', text: 'Teaching' },
  { url: '/partners/', text: 'Partners' },
  { url: '/contact/', text: 'Contact' },
];

const Header = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link to="/" className="navbar-item brand-color">
          <DICE className={styles.image} />
          {/* <h1>The Data Science Group</h1> */}
        </Link>

        <a
          role="button"
          className="navbar-burger burger"
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarBasicExample"
          onClick={() => setExpanded(!expanded)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </a>
      </div>

      <div
        id="navbarBasicExample"
        className={`navbar-menu ${expanded ? 'is-active' : ''}`}
      >
        <div className="navbar-start">
          {links.map(l => (
            <Link
              key={l.url}
              to={l.url}
              className="navbar-item"
              activeClassName="is-active"
            >
              {l.text}
            </Link>
          ))}
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <UPB className={styles.image} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
