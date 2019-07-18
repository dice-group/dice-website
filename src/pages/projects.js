import { graphql, Link } from 'gatsby';
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
          <div key={node.path}>
            <Link to={node.path}>{node.data.name}</Link>{' '}
            <span className="tag">{node.data.projectType.data.name}</span>
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
        data: { rdf_type: { eq: "https://schema.dice-research.org/Project" } }
      }
    ) {
      edges {
        node {
          path
          data {
            name
            projectType {
              data {
                name
              }
            }
          }
        }
      }
    }
  }
`;
