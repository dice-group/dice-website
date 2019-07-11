import React from 'react';
import { graphql } from 'gatsby';
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
            <a href={node.data.rdfs_url}>{node.data.rdfs_label}</a>
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
        data: { rdf_type: { eq: "http://schema.localhost:8080/Award" } }
      }
    ) {
      edges {
        node {
          id
          data {
            rdfs_label
            rdfs_url
          }
        }
      }
    }
  }
`;
