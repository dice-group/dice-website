import { graphql } from 'gatsby';
import _ from 'lodash';
import React from 'react';
import Layout from '../components/layout';
import Project from '../components/project';
import SEO from '../components/seo';

export default function Projects({
  data: {
    allRdf: { edges },
  },
}) {
  const projectsByType = _.groupBy(
    edges,
    p => p.node.data.rdf_type[0].data.name
  );

  return (
    <Layout>
      <SEO title="Projects" />
      <div className="content">
        {Object.keys(projectsByType).map(type => (
          <div
            key={type}
            className="tile is-vertical"
            style={{ marginBottom: '3em' }}
          >
            <h2 style={{ marginBottom: '1em' }}>{type}</h2>
            <div className="tile is-ancestor">
              {projectsByType[type].map(project => (
                <Project key={project.path} project={project.node} />
              ))}
            </div>
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
              id: {
                in: [
                  "https://dice-research.org/FundedProject"
                  "https://dice-research.org/ProductionReadyProject"
                  "https://dice-research.org/IncubatorProject"
                  "https://dice-research.org/AlumniProject"
                ]
              }
            }
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
