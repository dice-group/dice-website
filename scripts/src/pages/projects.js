import { graphql, Link } from 'gatsby';
import React from 'react';
import Image from '../components/image';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Projects({
  data: {
    allRdf: { edges },
  },
}) {
  return (
    <Layout>
      <SEO title="Projects" />
      <div className="content tile is-ancestor">
        {edges.map(({ node }) => (
          <div key={node.path} className="card" style={{ margin: '1em' }}>
            <div className="card-content">
              <div className="media">
                <div className="media-left">
                  <figure className="image is-64x64">
                    <Image
                      filename={node.data.logo}
                      alt={`${node.data.name} logo`}
                    />
                  </figure>
                </div>
                <div className="media-content">
                  <p className="title is-4">
                    <Link to={node.path}>{node.data.name}</Link>
                  </p>
                  <p className="subtitle is-6">
                    {node.data.rdf_type[0].data.name}
                  </p>
                </div>
              </div>

              <div className="content">{node.data.tagline}</div>
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
