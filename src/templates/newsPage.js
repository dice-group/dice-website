import React from 'react';
import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Template({
  data: {
    mdx: { frontmatter, body },
  },
}) {
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <h1>{frontmatter.title}</h1>
      <div>Published on: {frontmatter.date}</div>
      <MDXRenderer>{body}</MDXRenderer>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    mdx(fields: { path: { eq: $path } }) {
      frontmatter {
        title
        date
      }
      body
    }
  }
`;
