import { graphql, Link } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import Layout from '../../components/layout';
import SEO from '../../components/seo';

export default function Mentoring({
  data: {
    allMdx: { edges },
  },
}) {
  return (
    <Layout withContainer={false}>
      <SEO title="Mentoring" />
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
        <div className="container content mentoring">
          <h1 className="header">Mentoring</h1>

          {edges.map(({ node }) => (
            <MDXRenderer key={node.id}>{node.body}</MDXRenderer>
          ))}
        </div>
      </section>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allMdx(
      filter: { fields: { type: { eq: "mentoring" } } }
      sort: { fields: frontmatter___date, order: ASC }
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
            type
          }
          body
        }
      }
    }
  }
`;
