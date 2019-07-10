import { Link } from 'gatsby';
import React from 'react';

const Navbar = () => (
  <div
    style={{
      maxWidth: 960,
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
    }}
  >
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
