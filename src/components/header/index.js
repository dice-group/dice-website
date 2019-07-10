import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import React from 'react';
import Navbar from '../navbar';
import styles from './header.module.css';

const Header = ({ siteTitle }) => (
  <header className={styles.header}>
    <div className={styles.headerWrap}>
      <img
        className={styles.image}
        src="https://dice-research.org/fileadmin/template/img/DICE.svg"
      />
      <h1 style={{ margin: 0 }}>
        <Link
          to="/"
          style={{
            color: `black`,
            textDecoration: `none`,
            fontSize: '0.7em',
          }}
        >
          {siteTitle}
        </Link>
      </h1>
    </div>
    <Navbar />
  </header>
);

Header.propTypes = {
  siteTitle: PropTypes.string,
};

Header.defaultProps = {
  siteTitle: ``,
};

export default Header;
