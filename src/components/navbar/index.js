import { Link } from 'gatsby';
import React from 'react';

import styles from './navbar.module.css';

const links = [
  { url: '/', text: 'About' },
  { url: '/awards', text: 'Awards' },
  { url: '/team', text: 'Team' },
  { url: '/projects', text: 'Projects' },
  { url: '/publications', text: 'Publications' },
  { url: '/news', text: 'News' },
  { url: '/theses', text: 'Theses' },
  { url: '/teaching', text: 'Teaching' },
  { url: '/partners', text: 'Partners' },
  { url: '/contact', text: 'Contact' },
];

const Navbar = () => (
  <div className={styles.navbar}>
    {links.map(l => (
      <Link
        key={l.url}
        to={l.url}
        className={styles.link}
        activeClassName={styles.activeLink}
      >
        {l.text}
      </Link>
    ))}
  </div>
);

export default Navbar;
