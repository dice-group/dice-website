import { graphql } from 'gatsby';
import React from 'react';
import Layout from '../components/layout';
import PapersFilter from '../components/papers/filter';
import Paper from '../components/papers/paper';
import SEO from '../components/seo';

export default function Publications({
  data: {
    allRdf: { edges },
  },
}) {
  return (
    <Layout>
      <SEO title="Publications" />
      <div className="content">
        <h1 className="header">Publications</h1>
        <PapersFilter edges={edges}>
          {papers =>
            papers.map(({ node }) => <Paper key={node.id} data={node.data} />)
          }
        </PapersFilter>
      </div>
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
              id: { eq: "https://schema.dice-research.org/Publication" }
            }
          }
        }
      }
    ) {
      edges {
        node {
          data {
            type
            title
            publicationType
            year
            source
            tag
            url
            pdfUrl
            bibsonomyId
            author {
              id
              path
              data {
                name
              }
            }
            authorName
          }
          id
        }
      }
    }
  }
`;
