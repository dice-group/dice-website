import { Link } from 'gatsby';
import React, { useState } from 'react';
import DICE from '../svgs/dice.inline.svg';
import styles from './header.module.css';

const links = [
  { url: '/', text: 'Home' },
  { url: '/projects/', text: 'Projects' },
  { url: '/publications/', text: 'Publications' },
  { url: '/awards/', text: 'Awards' },

  { url: '/teaching/', text: 'For students' },
  { url: '/demos/', text: 'For collaborators' },

  { url: '/team/', text: 'Team' },
  { url: '/jobs', text: 'Jobs' },
];

const Header = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link to="/" className="navbar-item brand-color">
          <DICE className={`${styles.image} dice-nav-logo`} />
          {/* <h1>The Data Science Group</h1> */}
        </Link>

        <a
          role="button"
          className="navbar-burger burger"
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarMenu"
          onClick={() => setExpanded(!expanded)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </a>
      </div>

      <div
        id="navbarMenu"
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
            <Link to="/contact/" className="button">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
