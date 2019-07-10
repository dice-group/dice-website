import { Link } from 'gatsby';
import React from 'react';
import Navbar from '../navbar';
import styles from './header.module.css';

const Header = () => (
  <header className={styles.header}>
    <div className={styles.headerWrap}>
      <img
        className={styles.image}
        src="https://dice-research.org/fileadmin/template/img/DICE.svg"
      />
      <h1 className={styles.title}>
        <Link
          to="/"
          style={{
            color: `black`,
            textDecoration: `none`,
            fontSize: '0.7em',
          }}
        >
          The Data Science Group
        </Link>
      </h1>
      <img
        className={styles.image}
        src="https://dice-research.org/fileadmin/template/img/upb_logo.svg"
      />
    </div>
    <Navbar />
  </header>
);

export default Header;
