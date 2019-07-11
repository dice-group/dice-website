import _ from 'lodash';
import React from 'react';
import { graphql, Link } from 'gatsby';
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
      <div>
        {edges.map(({ node }) => (
          <div key={node.path}>
            <Link to={node.path}>{node.data.rdfs_label}</Link>
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
        data: { rdf_type: { eq: "http://xmlns.com/foaf/0.1/Project" } }
      }
    ) {
      edges {
        node {
          path
          data {
            rdfs_label
          }
        }
      }
    }
  }
`;
