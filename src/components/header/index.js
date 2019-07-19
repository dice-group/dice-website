import { Link } from 'gatsby';
import React from 'react';
import Navbar from '../navbar';
import DICE from './dice.inline.svg';
import styles from './header.module.css';
import UPB from './upb.inline.svg';

const Header = () => (
  <header className={styles.header}>
    <div className={styles.headerWrap}>
      <DICE className={styles.image} />
      <h1 className={styles.title}>
        <Link to="/" className={styles.title}>
          The Data Science Group
        </Link>
      </h1>
      <UPB className={styles.image} />
    </div>
    <Navbar />
  </header>
);

export default Header;
