import { graphql, Link } from 'gatsby';
import _ from 'lodash';
import React from 'react';
import Layout from '../../components/layout';
import SEO from '../../components/seo';

export default function Theses({
  data: {
    allMdx: { edges },
  },
}) {
  const thesesByType = _.groupBy(edges, 'node.frontmatter.type');

  return (
    <Layout withContainer={false}>
      <SEO title="Theses" />
      <div className="tabs">
        <ul className="container">
          <li>
            <Link to="/students/teaching/">Teaching</Link>
          </li>
          <li>
            <Link to="/students/mentoring/">Mentoring</Link>
          </li>
          <li className="is-active">
            <a>Theses</a>
          </li>
        </ul>
      </div>

      <section className="section">
        <div className="container content theses">
          <h1>Theses</h1>

          <Link to="/thesesinfo/">
            Information about writing student theses at DICE
          </Link>

          {Object.keys(thesesByType).map(type => (
            <div className="kind" key={type}>
              <h2>{type}</h2>

              {thesesByType[type].map(({ node }) => (
                <Link key={node.id} to={node.fields.path}>
                  {node.frontmatter.title}
                </Link>
              ))}
            </div>
          ))}
          
          <h2>Department</h2>
          <a target="_blank" href="https://cs.uni-paderborn.de/en/research/research/professors-and-fields-of-expertise">Professors and groups</a>
          <br />
          <a target="_blank" href="https://cs.uni-paderborn.de/en/studies/study-organization/bachelors-masters-theses">Open theses lists</a>
          

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
