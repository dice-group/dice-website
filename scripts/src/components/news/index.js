import { graphql, Link, useStaticQuery } from 'gatsby';
import React, { useEffect, useState } from 'react';
import Image from '../image';
import DICE from '../svgs/dice.inline.svg';

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

const News = ({ limit = 10, paginate = true }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState([]);
  const {
    allMdx: { edges },
  } = useStaticQuery(newsQuery);

  useEffect(() => {
    const newPagesCount = Math.floor(edges.length / limit);
    const newPages = [];
    for (let i = 0; i < newPagesCount; i++) {
      newPages.push(i);
    }
    setPages(newPages);
  }, [edges.length]);

  return (
    <>
      {paginate && pages.length > 0 && (
        <div>
          <nav
            className="pagination is-centered"
            role="navigation"
            aria-label="pagination"
          >
            <ul className="pagination-list">
              {pages.map(page => (
                <li>
                  <a
                    className={`pagination-link ${page === currentPage &&
                      'is-current'}`}
                    aria-label="Goto page 1"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page + 1}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
      <div className="content">
        {edges
          .slice(limit * currentPage, limit * currentPage + limit)
          .map(({ node }) => (
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
      </div>
    </>
  );
};

export default News;
