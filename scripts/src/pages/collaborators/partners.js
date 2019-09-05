import { graphql, Link } from 'gatsby';
import React from 'react';
import Image from '../../components/image';
import Layout from '../../components/layout';
import SEO from '../../components/seo';

export default function Partners({
  data: {
    allRdf: { edges },
  },
}) {
  const data = edges.sort((a, b) =>
    a.node.data.name.localeCompare(b.node.data.name)
  );

  return (
    <Layout withContainer={false}>
      <SEO title="Projects" />
      <div className="tabs">
        <ul className="container">
          <li>
            <Link to="/collaborators/demos/">Demos</Link>
          </li>
          <li className="is-active">
            <a>Partners</a>
          </li>
        </ul>
      </div>

      <section className="section">
        <div className="container">
          <div className="content columns is-multiline is-5 is-variable">
            {data.map(({ node }) => (
              <div
                key={node.id}
                className="column is-3"
                style={{ margin: '1em' }}
              >
                <div className="image is-64x64" style={{ marginRight: 10 }}>
                  <Image filename={node.data.logo} />
                </div>
                <p className="title">
                  <a href={node.data.url}>{node.data.name}</a>
                </p>
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
            elemMatch: {
              id: { eq: "https://schema.dice-research.org/Partner" }
            }
          }
        }
      }
    ) {
      edges {
        node {
          id
          data {
            name
            country
            url
            logo
          }
        }
      }
    }
  }
`;
