import { graphql, useStaticQuery } from 'gatsby';
import React from 'react';
import Project from '../project';

const newsQuery = graphql`
  {
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
          status: { eq: "active" }
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

const ActiveProjects = ({ limit = 6 }) => {
  const {
    allRdf: { edges },
  } = useStaticQuery(newsQuery);

  return (
    <div className="columns is-multiline is-5 is-variable">
      {edges.slice(0, limit).map(({ node }) => (
        <div className="column is-one-third" key={node.path}>
          <Project project={node} />
        </div>
      ))}
    </div>
  );
};

export default ActiveProjects;
