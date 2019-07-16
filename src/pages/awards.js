import { graphql } from 'gatsby';
import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Template({
  data: {
    allRdf: { edges },
  },
}) {
  return (
    <Layout>
      <SEO title="Projects" />
      <div style={{ paddingBottom: 30 }}>
        {edges.map(({ node }) => (
          <div key={node.id}>
            <a href={node.data.url}>{node.data.name}</a>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allRdf(
      filter: {
        data: { rdf_type: { eq: "https://schema.dice-research.org/Award" } }
      }
    ) {
      edges {
        node {
          id
          data {
            name
            url
          }
        }
      }
    }
  }
`;
