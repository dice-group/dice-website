import { graphql, navigate } from 'gatsby';
import React from 'react';
import CollaboratorsNav from '../../components/collabnav';
import Layout from '../../components/layout';
import Project from '../../components/project';
import SEO from '../../components/seo';

export default function ActiveProjects({
  data: {
    allRdf: { edges },
  },
}) {
  return (
    <Layout withContainer={false}>
      <SEO title="Active Projects" />
      <CollaboratorsNav activeLink="/collaborators/activeprojects/" />

      <section className="section">
        <div className="container content demos-page">
          <h1>Active Projects</h1>

          <div className="columns is-multiline is-5 is-variable">
            {edges.map(({ node }) => (
              <div className="column is-one-third" key={node.path}>
                <Project key={node.path} project={node} renderType={false} />
              </div>
            ))}
          </div>

          <div className="is-flex has-content-centered" style={{ padding: 20 }}>
            <button
              onClick={() => navigate('/projects/')}
              className="button is-link action-button"
            >
              Show all projects
            </button>
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
            elemMatch: { id: { eq: "https://dice-research.org/FundedProject" } }
          }
        }
      }
    ) {
      edges {
        node {
          path
          data {
            rdf_type {
              data {
                name
                priority
              }
            }
            tagline
            status
            content
            endDate
            startDate
            name
            homepage
            logo
            sourceCode
          }
        }
      }
    }
  }
`;
