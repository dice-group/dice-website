import { MDXProvider } from '@mdx-js/react';
import { Link } from 'gatsby';
import React from 'react';
import ExternalLink from '../components/externalLink';
import Footer from './footer';
import Header from './header';
import Image from './image';
import './styles/main.css';
import Table from './table';

// components that are exposed to MDX files
const mdxComponents = { Image, Link, ExternalLink, Table };

export default function Layout({ children, withContainer = true }) {
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
}
