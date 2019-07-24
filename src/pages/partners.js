import { graphql } from 'gatsby';
import React from 'react';
import Image from '../components/image';
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
      <div className="content tile is-ancestor">
        {edges.map(({ node }) => (
          <div key={node.id} className="tile" style={{ margin: '1em' }}>
            <div className="image is-64x64" style={{ marginRight: 10 }}>
              <Image filename={node.data.logo} />
            </div>
            <p className="title">
              <a href={node.data.url}>{node.data.name}</a>
            </p>
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
        data: {
          rdf_type: {
            elemMatch: {
              id: { eq: "https://schema.dice-research.org/Partner" }
            }
          }
        }
      }
    ) {
      edges {
        node {
          id
          data {
            name
            country
            url
            logo
          }
        }
      }
    }
  }
`;
