/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import { MDXProvider } from '@mdx-js/react';
import PropTypes from 'prop-types';
import React from 'react';
import Header from './header';
import Image from './image';
import './styles/main.scss';

const mdxComponents = { Image };

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <section className="section">
        <div className="container">
          <MDXProvider components={mdxComponents}>{children}</MDXProvider>
          <footer>
            © {new Date().getFullYear()}, Built with
            {` `}
            <a href="https://www.gatsbyjs.org">Gatsby</a>
          </footer>
        </div>
      </section>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
