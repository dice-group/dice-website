import React from 'react';
import { graphql, Link } from 'gatsby';
import ReactMarkdown from 'react-markdown';

import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Template({ data: { rdf } }) {
  const {
    data: { site_content, foaf_name, website_role, website_project },
  } = rdf;
  return (
    <Layout>
      <SEO title={`${foaf_name}`} />
      <div>
        <h1>{foaf_name}</h1>
        <h3>Role: {website_role.data.rdfs_label}</h3>
        <h3 style={{ textDecoration: 'underline' }}>Description:</h3>
        <div>
          {site_content &&
            site_content.map(mdString => <ReactMarkdown source={mdString} />)}
        </div>
        <h3 style={{ textDecoration: 'underline' }}>Projects:</h3>
        <div style={{ paddingBottom: 30 }}>
          {website_project.map(p => (
            <Link style={{ paddingRight: 10 }} to={`/${p.path}`}>
              {p.data.rdfs_label}
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
        foaf_name
        foaf_familyName
        site_content
        website_role {
          data {
            rdfs_label
          }
        }
        website_project {
          path
          data {
            rdfs_label
          }
        }
      }
    }
  }
`;
