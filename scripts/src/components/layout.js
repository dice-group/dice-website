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
import ExternalLink from '../components/externalLink';
import Footer from './footer';
import Header from './header';
import Image from './image';
import './styles/main.scss';

const mdxComponents = { Image, Link, ExternalLink };

const Layout = ({ children, withContainer = true }) => {
  return (
    <MDXProvider components={mdxComponents}>
      <Header />
      {withContainer ? (
        <section className="section">
          <div className="container">{children}</div>
        </section>
      ) : (
        <>{children}</>
      )}
      <Footer />
    </MDXProvider>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
