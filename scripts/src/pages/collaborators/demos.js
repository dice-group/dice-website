import { graphql } from 'gatsby';
import React from 'react';
import CollaboratorsNav from '../../components/collabnav';
import Demo from '../../components/demo';
import Layout from '../../components/layout';
import SEO from '../../components/seo';

export default function Demos({
  data: {
    allRdf: { edges },
  },
}) {
  return (
    <Layout withContainer={false}>
      <SEO title="Demos" />
      <CollaboratorsNav activeLink="/collaborators/demos/" />

      <section className="section">
        <div className="container content demos-page">
          <h1>Demos</h1>

          <div className="columns is-multiline is-5 is-variable">
            {edges.map(({ node }) => (
              <div className="column is-one-third" key={node.path}>
                <Demo node={node} />
              </div>
            ))}
          </div>
        </div>
      </section>
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
            logo
            screenshot
          }
        }
      }
    }
  }
`;
