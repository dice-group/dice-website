import { graphql, StaticQuery } from 'gatsby';
import React from 'react';
import PapersFilter from './filter';
import Paper from './paper';

const PapersList = ({ name, publicationTag, path }) => (
  <StaticQuery
    query={graphql`
      query PersonPublications {
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
          sort: { fields: [data___year], order: DESC }
        ) {
          edges {
            node {
              id
              data {
                type
                title
                publicationType
                year
                source
                tag
                url
                pdfUrl
                doi
                presentationUrl
                videoUrl
                bibsonomyId
                author {
                  id
                  path
                }
                authorName
              }
            }
          }
        }
      }
    `}
    render={({ allRdf: { edges } }) => {
      const normName = (name || '').trim().toLowerCase();

      const matches = edges.filter(({ node }) => {
        const d = node.data || {};
        const byPath = (d.author || []).some(a => a.path === path);
        const byExactName = (d.authorName || []).some(
          n => (n || '').toLowerCase() === normName
        );
        const byTag = publicationTag
          ? (d.tag || []).includes(publicationTag)
          : false;
        return byPath || byExactName || byTag;
      });

      const uniqueEdges = Array.from(
        new Map(matches.map(e => [e.node.id, e])).values()
      );

      if (uniqueEdges.length === 0) return <p>No publications yet.</p>;

      return (
        <PapersFilter edges={uniqueEdges} limit={5}>
          {papers =>
            papers.map(({ node }) => <Paper key={node.id} data={node.data} />)
          }
        </PapersFilter>
      );
    }}
  />
);

export default PapersList;
