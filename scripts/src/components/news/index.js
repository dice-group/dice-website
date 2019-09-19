import { graphql, Link, useStaticQuery } from 'gatsby';
import React, { useEffect, useState } from 'react';

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
                <li key={page}>
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
            <div key={node.id} style={{ marginBottom: '2em' }}>
              <h6
                className="subtitle has-text-grey-light"
                title={node.frontmatter.fullDate}
                style={{ paddingBottom: 10 }}
              >
                {node.frontmatter.date}
              </h6>
              <h4 className="title" style={{ marginBottom: '2em' }}>
                <Link to={node.fields.path}>{node.frontmatter.title}</Link>
              </h4>
            </div>
          ))}
      </div>
    </>
  );
};

export default News;
