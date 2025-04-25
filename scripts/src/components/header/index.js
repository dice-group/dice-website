import { Link } from 'gatsby';
import React, { useState } from 'react';
import DICE from '../svgs/dice.inline.svg';

const links = [
  { url: '/', text: 'Home' },
  { url: '/groups/', text: 'Research' },
  { url: '/publications/', text: 'Publications' },
  { url: '/awards/', text: 'Awards' },
  { url: '/students/', text: 'Student Offerings' },
  { url: '/team/', text: 'Team' },
  { url: '/jobs', text: 'Vacancies' },
];

const Header = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link to="/" className="navbar-brand-item">
          <DICE className="dice-nav-logo" />
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
        id="navbar-menu"
        className={`navbar-menu ${expanded ? 'is-active' : ''}`}
      >
        <div className="navbar-start">
          {links.map(l => (
            <div className="navbar-item-div">
              <Link
                key={l.url}
                to={l.url}
                className="navbar-item"
                activeClassName="is-active"
                partiallyActive={l.url !== '/'}
              >
                {l.text}
              </Link>
            </div>
          ))}
        </div>

        <div className="navbar-end">
          <div className="navbar-item is-active">
            <Link to="/contact/" className="contact-button">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
