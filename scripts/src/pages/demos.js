import { graphql, Link } from 'gatsby';
import React from 'react';
import Image from '../components/image';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Demos({
  data: {
    allRdf: { edges },
  },
}) {
  return (
    <Layout>
      <SEO title="Demos" />
      <div className="content tile is-ancestor">
        {edges.map(({ node }) => (
          <div key={node.path} className="card" style={{ margin: '1em' }}>
            <div className="card-content">
              <div className="media">
                <div className="media-left">
                  <figure className="image is-64x64">
                    <Image
                      filename={node.data.screenshot[0]}
                      alt={`${node.data.name} screenshot`}
                    />
                  </figure>
                </div>
                <div className="media-content">
                  <p className="title is-4">
                    <Link to={node.path}>{node.data.name}</Link>
                  </p>
                </div>
              </div>

              <div className="content">
                <p>{node.data.description}</p>
                <p>
                  Webpage: <a href={node.data.webpage}>{node.data.webpage}</a>
                </p>
                <p>
                  Maintainer:{' '}
                  <Link to={node.data.maintainer.path}>
                    {node.data.maintainer.data.name}
                  </Link>
                </p>
                <p>
                  Developers:{' '}
                  {node.data.developer.map(p => (
                    <Link key={p.path} to={p.path}>
                      {p.data.name}
                    </Link>
                  ))}
                </p>
              </div>
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
