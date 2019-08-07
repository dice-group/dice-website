import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Demo from '../components/demo';
import Image from '../components/image';
import Layout from '../components/layout';
import { Person, rdfToPeopleArray } from '../components/person';
import Project from '../components/project';
import SEO from '../components/seo';

export default function ProjectTemplate({
  data: {
    rdf: { data },
    allRdf: { edges },
  },
}) {
  const people = rdfToPeopleArray(edges);

  return (
    <Layout>
      <SEO title={`${data.name}`} />
      <div className="content">
        <h1 className="title">{data.name}</h1>
        <p className="subtitle">{data.tagline}</p>

        <div className="is-flex" style={{ padding: 10, paddingBottom: 20 }}>
          <div
            className="image gatsby-image"
            style={{ width: 200, height: 200 }}
          >
            <Image filename={data.logo} alt={`${data.name} logo`} />
          </div>

          <div className="is-flex" style={{ padding: 10 }}>
            <div
              className="is-flex data-column data-header"
              style={{
                textAlign: 'right',
              }}
            >
              {data.homepage && <div>Homepage:</div>}
              {data.sourceCode && <div>Source code:</div>}
              {data.status && <div>Status:</div>}
              {data.startDate && <div>Start date:</div>}
              {data.endDate && <div>End date:</div>}
              {data.fundingProgram && <div>Funding program:</div>}
              {data.maintainer && <div>Maintainer:</div>}
            </div>
            <div className="is-flex data-column">
              {data.homepage && (
                <div>
                  <a href={data.homepage}>{data.homepage}</a>
                </div>
              )}
              {data.sourceCode && (
                <div>
                  <a href={data.sourceCode}>{data.sourceCode}</a>
                </div>
              )}
              {data.status && <div>{data.status}</div>}
              {data.startDate && <div>{data.startDate}</div>}
              {data.endDate && <div>{data.endDate}</div>}
              {data.fundingProgram && <div>{data.fundingProgram}</div>}
              {data.maintainer && (
                <div>
                  <Link to={data.maintainer.path}>
                    {data.maintainer.data.name}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          {data.content &&
            data.content.map((mdString, i) => (
              <ReactMarkdown key={`content_${i}`} source={mdString} />
            ))}
        </div>

        {data.partner && (
          <>
            <h1>Partners</h1>

            <div
              className="tile is-ancestor"
              style={{ paddingTop: 30, paddingLeft: 30 }}
            >
              {data.partner.map(partner => (
                <div key={partner.id} className="tile">
                  <div className="image is-64x64" style={{ marginRight: 10 }}>
                    <Image filename={partner.data.logo} />
                  </div>
                  <a href={partner.data.url}>{partner.data.name}</a>
                </div>
              ))}
            </div>
          </>
        )}

        {data.relatedDemo && (
          <>
            <h1>Related demos</h1>

            <div className="tile is-ancestor">
              {data.relatedDemo.map(demo => (
                <Demo key={demo.id} node={demo} />
              ))}
            </div>
          </>
        )}

        {data.relatedProject && (
          <>
            <h1>Related projects</h1>

            <div className="tile is-ancestor">
              {data.relatedProject.map(proj => (
                <Project key={proj.id} project={proj} />
              ))}
            </div>
          </>
        )}

        <h1>Staff</h1>
        <div className="tile is-ancestor" style={{ flexWrap: 'wrap' }}>
          {people.map(person => (
            <div key={person.path} className="tile is-4">
              <Person key={person.path} person={person} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    rdf(path: { eq: $path }) {
      data {
        tagline
        status
        content
        endDate
        startDate
        name
        homepage
        logo
        sourceCode
        fundingProgram
        relatedProject {
          id
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
        relatedDemo {
          id
          path
          data {
            name
            description
            screenshot
            webpage
            maintainer {
              path
              data {
                name
              }
            }
            developer {
              path
              data {
                name
              }
            }
          }
        }
        partner {
          id
          data {
            name
            url
            logo
          }
        }
        maintainer {
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
            elemMatch: { id: { eq: "https://schema.dice-research.org/Person" } }
          }
          project: { elemMatch: { path: { eq: $path } } }
        }
      }
    ) {
      edges {
        node {
          data {
            name
            email
            project {
              path
              data {
                name
              }
            }
            role {
              data {
                name
                priority
              }
            }
          }
          path
        }
      }
    }
  }
`;
