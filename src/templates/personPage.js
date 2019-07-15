import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Template({ data: { rdf } }) {
  const {
    data: { content, name, role, project },
  } = rdf;
  return (
    <Layout>
      <SEO title={`${name}`} />
      <div>
        <h1>{name}</h1>
        <h3>Role: {role.data.name}</h3>
        <h3 style={{ textDecoration: 'underline' }}>Description:</h3>
        <div>
          {content &&
            content.map(mdString => <ReactMarkdown source={mdString} />)}
        </div>
        <h3 style={{ textDecoration: 'underline' }}>Projects:</h3>
        <div style={{ paddingBottom: 30 }}>
          {project.map(p => (
            <Link style={{ paddingRight: 10 }} to={`/${p.path}`}>
              {p.data.name}
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    rdf(path: { eq: $path }) {
      data {
        name
        content
        role {
          data {
            name
          }
        }
        project {
          path
          data {
            name
          }
        }
      }
    }
  }
`;
