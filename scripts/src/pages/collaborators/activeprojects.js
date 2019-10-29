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
        <div className="container content">
          <h1 className="header">Active Projects</h1>

          <div className="columns">
            {edges.map(({ node }) => (
              <div className="column is-one-third" key={node.path}>
                <Project key={node.path} project={node} renderType={false} />
              </div>
            ))}
          </div>

          <div className="flex justify-center p-4">
            <button
              onClick={() => navigate('/projects/')}
              className="action-button"
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
