import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Image from '../components/image';
import Layout from '../components/layout';
import PapersFilter from '../components/papers/filter';
import Paper from '../components/papers/paper';
import SEO from '../components/seo';

export default function Template({ data: { rdf, allRdf } }) {
  const {
    data: {
      content,
      name,
      namePrefix,
      role,
      project,
      phone,
      fax,
      email,
      office,
      photo,
    },
  } = rdf;
  const { edges } = allRdf;
  return (
    <Layout>
      <SEO title={`${namePrefix} ${name}`} />
      <div className="content">
        <h1 className="title">
          {namePrefix} {name}
        </h1>

        <div
          className="image"
          style={{ width: 100, height: 100, overflow: 'hidden' }}
        >
          <Image filename={photo} alt={`${namePrefix} ${name} photo`} />
        </div>

        <p>Role: {role.data.name}</p>
        <p>Phone: {phone}</p>
        <p>Fax: {fax}</p>
        <p>
          Email: <a href={email}>{email.replace('mailto:', '')}</a>
        </p>
        <p>Office: {office}</p>
        <h2>Description:</h2>
        <div>
          {content &&
            content.map(mdString => <ReactMarkdown source={mdString} />)}
        </div>
        <h2>Projects:</h2>
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
        namePrefix
        phone
        fax
        email
        office
        photo
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
          rdf_type: {
            elemMatch: {
              id: { eq: "https://schema.dice-research.org/Publication" }
            }
          }
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
