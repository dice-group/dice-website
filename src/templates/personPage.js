import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Layout from '../components/layout';
import PapersFilter from '../components/papers/filter';
import Paper from '../components/papers/paper';
import SEO from '../components/seo';

export default function Template({ data: { rdf, allRdf } }) {
  const {
    data: { content, name, role, project },
  } = rdf;
  const { edges } = allRdf;
  return (
    <Layout>
      <SEO title={`${name}`} />
      <div>
        <h1>{name}</h1>
        <h3>Role: {role.data.name}</h3>
        <h3 style={{ textDecoration: 'underline' }}>Description:</h3>
        <div>
          {content &&
            content.map(mdString => <ReactMarkdown source={mdString} />)}
        </div>
        <h3 style={{ textDecoration: 'underline' }}>Projects:</h3>
        <div style={{ paddingBottom: 30 }}>
          {project.map(p => (
            <Link style={{ paddingRight: 10 }} to={`/${p.path}`}>
              {p.data.name}
            </Link>
          ))}
        </div>
        {edges && edges.length > 0 && (
          <PapersFilter edges={edges}>
            {papers =>
              papers.map(({ node }) => <Paper key={node.id} data={node.data} />)
            }
          </PapersFilter>
        )}
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
        role {
          data {
            name
          }
        }
        project {
          path
          data {
            name
          }
        }
      }
    }
    allRdf(
      filter: {
        data: {
          rdf_type: { eq: "https://schema.dice-research.org/Publication" }
          author: { elemMatch: { path: { eq: $path } } }
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
