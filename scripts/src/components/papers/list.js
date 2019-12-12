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

export default ({ name, publicationTag, path }) => {
  const {
    allRdf: { edges: allPapers },
  } = useStaticQuery(papersQuery);

  const papers = allPapers.filter(
    ({
      node: {
        data: { tag, authorName, author },
      },
    }) => {
      const hasTag =
        publicationTag &&
        tag &&
        tag.length > 0 &&
        tag.find(
          t =>
            t.localeCompare(publicationTag, 'en', { sensitivity: 'base' }) === 0
        ) !== undefined;
      const hasAuthorByName =
        name &&
        authorName &&
        authorName.length > 0 &&
        authorName.find(
          n => n.localeCompare(name, 'en', { sensitivity: 'base' }) === 0
        ) !== undefined;
      const hasAuthorByPath = author && author.find(a => a.path === path);
      return hasTag || hasAuthorByName || hasAuthorByPath;
    }
  );

  return (
    <PapersFilter limit={5} edges={papers}>
      {papers =>
        papers.length === 0 ? (
          <div className="paper">
            <h3 className="paper-name">No papers found</h3>
          </div>
        ) : (
          papers.map(({ node }) => <Paper key={node.id} data={node.data} />)
        )
      }
    </PapersFilter>
  );
};
