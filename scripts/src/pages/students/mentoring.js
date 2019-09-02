import { graphql, Link } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import Layout from '../../components/layout';
import SEO from '../../components/seo';

export default function Teaching({
  data: {
    allMdx: { edges },
  },
}) {
  return (
    <Layout withContainer={false}>
      <SEO title="Teaching" />
      <div className="tabs">
        <ul className="container">
          <li>
            <Link to="/students/teaching/">Teaching</Link>
          </li>
          <li className="is-active">
            <a>Mentoring</a>
          </li>
          <li>
            <Link to="/students/theses/">Theses</Link>
          </li>
        </ul>
      </div>

      <section className="section">
        <div className="container content">
          <h1>Mentoring</h1>

          <div className="tile is-ancestor is-vertical">
            {edges.map(({ node }) => (
              <div
                key={node.id}
                className="tile is-vertical"
                style={{ margin: '1em' }}
              >
                <p className="title">{node.frontmatter.title}</p>

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
    allMdx(
      filter: { fields: { type: { eq: "mentoring" } } }
      sort: { fields: frontmatter___date, order: DESC }
    ) {
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
