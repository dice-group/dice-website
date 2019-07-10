import React from 'react';
import { Link } from 'gatsby';
import { graphql, useStaticQuery } from 'gatsby';

const newsQuery = graphql`
  {
    allMdx(filter: { fields: { type: { eq: "news" } } }) {
      edges {
        node {
          id
          fields {
            path
            type
          }
          frontmatter {
            title
            date
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
    <div>
      {edges.map(({ node }) => (
        <div key={node.id}>
          <Link to={node.fields.path}>{node.frontmatter.title}</Link>{' '}
          {node.frontmatter.date}
          <p>{node.excerpt}</p>
        </div>
      ))}
    </div>
  );
};

export default News;
