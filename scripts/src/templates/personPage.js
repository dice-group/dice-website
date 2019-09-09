import { graphql } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Image from '../components/image';
import Layout from '../components/layout';
import PapersFilter from '../components/papers/filter';
import Paper from '../components/papers/paper';
import Project from '../components/project';
import SEO from '../components/seo';

export default function PersonTemplate({ data: { rdf, allRdf } }) {
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

        <div className="is-flex" style={{ padding: 10, paddingBottom: 20 }}>
          <div
            className="image gatsby-image"
            style={{ width: 200, height: 200 }}
          >
            <Image filename={photo} alt={`${namePrefix} ${name} photo`} />
          </div>

          <div className="is-flex" style={{ padding: 10 }}>
            <div
              className="is-flex data-column data-header"
              style={{
                textAlign: 'right',
              }}
            >
              <div>Role:</div>
              {phone && <div>Phone:</div>}
              {fax && <div>Fax:</div>}
              {email && <div>Email:</div>}
              {office && <div>Office:</div>}
            </div>
            <div className="is-flex data-column">
              <div>{role.data.name}</div>
              {phone && <div>{phone}</div>}
              {fax && <div>{fax}</div>}
              {email && (
                <div>
                  <a href={email}>{email.replace('mailto:', '')}</a>
                </div>
              )}
              {office && <div>{office}</div>}
            </div>
          </div>
        </div>
        <div>
          {content &&
            content.map((mdString, i) => (
              <ReactMarkdown key={`content_${i}`} source={mdString} />
            ))}
        </div>
        <h1>Projects</h1>
        {project && (
          <div className="tile is-ancestor">
            {project.map(p => (
              <Project key={p.path} project={p} />
            ))}
          </div>
        )}
        <h1>Publications</h1>
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
            rdf_type {
              data {
                name
              }
            }
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
