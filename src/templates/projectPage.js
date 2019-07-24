import { graphql } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Layout from '../components/layout';
import { Person, rdfToPeopleArray } from '../components/person';
import SEO from '../components/seo';

export default function Template({ data }) {
  const {
    rdf: {
      data: { name, content },
    },
    allRdf: { edges },
  } = data;

  const people = rdfToPeopleArray(edges);

  return (
    <Layout>
      <SEO title={`${name}`} />
      <div className="content">
        <h1>{name}</h1>
        <h3 style={{ textDecoration: 'underline' }}>Description:</h3>

        <div style={{ paddingBottom: 30 }}>
          {content &&
            content.map(mdString => <ReactMarkdown source={mdString} />)}
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
        name
        content
      }
    }
    allRdf(
      filter: {
        data: {
          rdf_type: {
            elemMatch: { id: { eq: "https://schema.dice-research.org/Person" } }
          }
          project: { elemMatch: { path: { eq: $path } } }
        }
      }
    ) {
      edges {
        node {
          data {
            name
            email
            project {
              path
              data {
                name
              }
            }
            role {
              data {
                name
                priority
              }
            }
          }
          path
        }
      }
    }
  }
`;
