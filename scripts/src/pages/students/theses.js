import { Link, graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import Layout from '../../components/layout';
import Person from '../../components/person/dynamic';
import SEO from '../../components/seo';

export default function Theses({
  data: {
    allMdx: { edges },
  },
}) {
  return (
    <Layout withContainer={false}>
      <SEO title="Theses" />
      <div className="tabs">
        <ul className="container">
          <li>
            <Link to="/students/teaching/">Teaching</Link>
          </li>
          <li className="is-active">
            <a>Theses</a>
          </li>
        </ul>
      </div>

      <section className="section">
        <div className="container">
          <div className="content tile is-ancestor is-vertical">
            {edges.map(({ node }) => (
              <div
                key={node.id}
                className="tile is-vertical"
                style={{ margin: '1em' }}
              >
                <p className="title">{node.frontmatter.title}</p>

                <p className="subtitle">
                  Type: <strong>{node.frontmatter.type}</strong>
                  <br />
                  Supervisor: <Person id={node.frontmatter.supervisor} />
                  <br />
                  Contact: <Person id={node.frontmatter.contact} />
                </p>

                <MDXRenderer>{node.body}</MDXRenderer>
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
    allMdx(filter: { fields: { type: { eq: "theses" } } }) {
      edges {
        node {
          id
          fields {
            path
            type
          }
          frontmatter {
            title
            supervisor
            contact
            type
          }
          body
        }
      }
    }
  }
`;
