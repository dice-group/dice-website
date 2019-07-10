import { Link } from 'gatsby';
import React from 'react';

import styles from './navbar.module.css';

const Navbar = () => (
  <div className={styles.navbar}>
    <Link to="/">About</Link>
    <Link to="/">Awards</Link>
    <Link to="/">Team</Link>
    <Link to="/">Projects</Link>
    <Link to="/">Publications</Link>
    <Link to="/">News</Link>
    <Link to="/">Theses</Link>
    <Link to="/">Teaching</Link>
    <Link to="/">Partners</Link>
    <Link to="/">Contact</Link>
  </div>
);

export default Navbar;
