import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Template({
  data: {
    allMdx: { edges },
  },
}) {
  return (
    <Layout>
      <SEO title="Theses" />
      <div className="content tile is-ancestor is-vertical">
        {edges.map(({ node }) => (
          <div
            key={node.id}
            className="tile is-vertical"
            style={{ margin: '1em' }}
          >
            <p className="title">{node.frontmatter.title}</p>

            <MDXRenderer>{node.body}</MDXRenderer>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allMdx(filter: { fields: { type: { eq: "teaching" } } }) {
      edges {
        node {
          id
          fields {
            path
            type
          }
          frontmatter {
            title
            supervisor
            contact
            type
          }
          body
        }
      }
    }
  }
`;
