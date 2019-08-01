import { graphql } from 'gatsby';
import React from 'react';
import Demo from '../components/demo';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Demos({
  data: {
    allRdf: { edges },
  },
}) {
  return (
    <Layout>
      <SEO title="Demos" />
      <div className="content tile is-ancestor">
        {edges.map(({ node }) => (
          <Demo key={node.path} node={node} />
        ))}
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allRdf(
      filter: {
        data: {
          rdf_type: {
            elemMatch: { id: { eq: "https://schema.dice-research.org/Demo" } }
          }
        }
      }
    ) {
      edges {
        node {
          path
          data {
            name
            description
            screenshot
            webpage
            maintainer {
              path
              data {
                name
              }
            }
            developer {
              path
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
