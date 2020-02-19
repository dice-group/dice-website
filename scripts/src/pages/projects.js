import { graphql } from 'gatsby';
import _ from 'lodash';
import React, { useMemo } from 'react';
import Layout from '../components/layout';
import Project from '../components/project';
import SEO from '../components/seo';
import ProjectsNav from '../components/projectsnav';

export default function Projects({
  data: {
    allRdf: { edges },
  },
}) {
  const projectsByType = useMemo(
    () =>
      _.groupBy(
        _.sortBy(edges, p => p.node.data.rdf_type[0].data.priority),
        p => p.node.data.rdf_type[0].data.name
      ),
    [edges]
  );

  return (
    <Layout withContainer={false}>
      <SEO title="Projects" />
      <ProjectsNav activeLink="/projects/" />

      <section className="section">
        <div className="container content">
          {Object.keys(projectsByType).map(type => (
            <div key={type} className="category">
              <h1 className="header">{type}s</h1>
              <div className="columns is-padded">
                {projectsByType[type].map(({ node }) => (
                  <div className="column is-one-third" key={node.path}>
                    <Project
                      key={node.path}
                      project={node}
                      renderType={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
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
