import { graphql, Link } from 'gatsby';
import React from 'react';
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
      <div className="content tile is-ancestor is-vertical">
        {edges.map(({ node: { id, data } }) => (
          <div
            key={id}
            className="tile is-vertical"
            style={{ marginBottom: '2em' }}
          >
            <h5 className="title is-4">
              <a href={data.url}>{data.name}</a>
              <span className="tag" style={{ marginLeft: 10 }}>
                {data.year}
              </span>
            </h5>
            <p className="subtitle">{data.content}</p>
            <div className="tile">
              <div style={{ marginRight: 10 }}>Awarded to:</div>
              {data.awardee.map(person => (
                <span key={person.path}>
                  <Link to={person.path}>{person.data.name}</Link>
                </span>
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
            elemMatch: { id: { eq: "https://schema.dice-research.org/Award" } }
          }
        }
      }
    ) {
      edges {
        node {
          id
          data {
            name
            url
            content
            year
            awardee {
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
