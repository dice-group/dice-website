import { graphql, Link, useStaticQuery } from 'gatsby';
import React from 'react';
import Image from '../image';

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

const ActiveProjects = () => {
  const {
    allRdf: { edges },
  } = useStaticQuery(newsQuery);

  return (
    <div className="columns">
      {edges.map(({ node }) => (
        <div className="column is-one-third active-project" key={node.path}>
          <div className="project-image">
            <Image
              filename={node.data.logo}
              alt={`${node.data.name} logo`}
              style={{ width: 200 }}
            />
          </div>
          <h2 className="title">{node.data.name}</h2>
          <div className="separator" />
          <Link to={node.path} className="link has-text-grey">
            Learn more →
          </Link>
        </div>
      ))}
    </div>
  );
};

export default ActiveProjects;
