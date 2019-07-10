import React from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Template({ data: { rdf } }) {
  const {
    data: { foaf_name, website_role },
  } = rdf;
  return (
    <Layout>
      <SEO title={`${foaf_name}`} />
      <div>
        <h1>
          {foaf_name} - {website_role.data.rdfs_label}
        </h1>
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
        website_role {
          data {
            rdfs_label
          }
        }
      }
    }
  }
`;
