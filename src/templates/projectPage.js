import React from 'react';
import { graphql } from 'gatsby';
import ReactMarkdown from 'react-markdown';

import Layout from '../components/layout';
import SEO from '../components/seo';
import { Person, rdfToPeopleArray } from '../components/person';

export default function Template({ data }) {
  const {
    rdf: {
      data: { rdfs_label, site_content },
    },
    allRdf: { edges },
  } = data;

  const people = rdfToPeopleArray(edges);

  return (
    <Layout>
      <SEO title={`${rdfs_label}`} />
      <div>
        <h1>{rdfs_label}</h1>
        <h3 style={{ textDecoration: 'underline' }}>Description:</h3>

        <div style={{ paddingBottom: 30 }}>
          {site_content &&
            site_content.map(mdString => <ReactMarkdown source={mdString} />)}
        </div>

        <h3 style={{ textDecoration: 'underline' }}>Staff:</h3>
        <div>
          {people.map(person => (
            <Person key={person.path} person={person} />
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
        rdfs_label
        site_content
      }
    }
    allRdf(
      filter: {
        data: {
          rdf_type: { eq: "http://xmlns.com/foaf/0.1/Person" }
          website_project: { elemMatch: { path: { eq: $path } } }
        }
      }
    ) {
      edges {
        node {
          data {
            foaf_name
            foaf_mbox
            website_project {
              path
              data {
                rdfs_label
              }
            }
            website_role {
              data {
                rdfs_label
                websiteSchema_priority
              }
            }
          }
          path
        }
      }
    }
  }
`;
