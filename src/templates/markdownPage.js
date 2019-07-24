import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function MarkdownTemplate({
  data: {
    mdx: { frontmatter, body },
  },
}) {
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="content">
        <MDXRenderer>{body}</MDXRenderer>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    mdx(fields: { path: { eq: $path } }) {
      frontmatter {
        title
      }
      body
    }
  }
`;
