import { graphql, useStaticQuery } from 'gatsby';
import React from 'react';
import PapersFilter from './filter';
import Paper from './paper';

const papersQuery = graphql`
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
            url
            tag
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

export default ({ name, publicationTag }) => {
  const {
    allRdf: { edges: allPapers },
  } = useStaticQuery(papersQuery);

  const papers = allPapers.filter(({ node: { data: { tag, authorName } } }) => {
    const hasTag =
      publicationTag &&
      tag &&
      tag.length > 0 &&
      tag.find(
        t =>
          t.localeCompare(publicationTag, 'en', { sensitivity: 'base' }) === 0
      ) !== undefined;
    const hasAuthor =
      name &&
      authorName &&
      authorName.length > 0 &&
      authorName.find(
        n => n.localeCompare(name, 'en', { sensitivity: 'base' }) === 0
      ) !== undefined;
    return hasTag || hasAuthor;
  });

  console.log(papers);

  return (
    <PapersFilter limit={5} edges={papers}>
      {papers =>
        papers.map(({ node }) => <Paper key={node.id} data={node.data} />)
      }
    </PapersFilter>
  );
};
