import { graphql, Link } from 'gatsby';
import React from 'react';
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
      <div className="tabs">
        <ul className="container">
          <li className="is-active">
            <a>Demos</a>
          </li>
          <li>
            <Link to="/collaborators/partners/">Partners</Link>
          </li>
        </ul>
      </div>

      <section className="section">
        <div className="container content demos-page">
          <h1>Demos</h1>

          <div className="content columns is-multiline is-5 is-variable">
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
