/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import { MDXProvider } from '@mdx-js/react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import React from 'react';
import Footer from './footer';
import Header from './header';
import Image from './image';
import './styles/main.scss';

const mdxComponents = { Image, Link };

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <section className="section">
        <div className="container">
          <MDXProvider components={mdxComponents}>{children}</MDXProvider>
        </div>
      </section>
      <Footer />
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
