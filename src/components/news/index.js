import { graphql, Link, useStaticQuery } from 'gatsby';
import React from 'react';
import DICE from '../header/dice.inline.svg';
import Image from '../image';

const newsQuery = graphql`
  {
    allMdx(
      filter: { fields: { type: { eq: "news" } } }
      sort: { fields: frontmatter___date, order: DESC }
    ) {
      edges {
        node {
          id
          fields {
            path
            type
          }
          frontmatter {
            title
            fullDate: date
            date(fromNow: true)
            thumbnail
          }
          excerpt
        }
      }
    }
  }
`;

const News = () => {
  const {
    allMdx: { edges },
  } = useStaticQuery(newsQuery);

  return (
    <>
      {edges.map(({ node }) => (
        <div
          key={node.id}
          className="columns is-mobile"
          style={{ marginBottom: 20 }}
        >
          {node.frontmatter.thumbnail ? (
            <div className="column is-one-quarter">
              <Image
                filename={node.frontmatter.thumbnail}
                alt={node.frontmatter.title}
              />
            </div>
          ) : (
            <div
              className="column is-one-quarter is-flex"
              style={{ maxHeight: 200, justifyContent: 'center' }}
            >
              <DICE
                viewBox="0 0 700 763"
                height="100%"
                width="180"
                preserveAspectRatio="xMidYMid meet"
              />
            </div>
          )}
          <div className="column">
            <h2
              className="subtitle is-6 has-text-grey"
              title={node.frontmatter.fullDate}
              style={{ paddingBottom: 10 }}
            >
              Published {node.frontmatter.date}
            </h2>
            <h1 className="title is-4" style={{ marginBottom: 10 }}>
              <Link to={node.fields.path}>{node.frontmatter.title}</Link>
            </h1>

            <p>{node.excerpt}</p>
          </div>
        </div>
      ))}
    </>
  );
};

export default News;
