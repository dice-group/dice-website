import format from 'date-fns/format';
import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import BackButton from '../components/backButton';
import Demo from '../components/demo';
import Image from '../components/image';
import Layout from '../components/layout';
import { rdfToPeopleArray } from '../components/person';
import Project from '../components/project';
import SEO from '../components/seo';

const dateFormat = 'MMMM yyyy';

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
      <div className="content projects" style={{ marginBottom: 160 }}>
        <BackButton />

        <h1 className="title">{data.name}</h1>

        <p className="has-text-grey-light">
          {data.rdf_type[0].data.name} (
          {format(new Date(data.startDate), dateFormat)} -{' '}
          {format(new Date(data.endDate), dateFormat)})
        </p>

        <div className="project-card project-rounded project-full-info">
          <div className="project-image">
            <Image
              filename={data.logo}
              alt={`${data.name} logo`}
              style={{ width: 250 }}
            />
          </div>

          <p className="tagline">{data.tagline}</p>

          <div className="buttons">
            {data.homepage && (
              <a href={data.homepage} className="button is-medium is-link">
                Homepage
              </a>
            )}
            {data.sourceCode && (
              <a
                href={data.sourceCode}
                className="button is-medium is-link is-outlined"
              >
                Source code
              </a>
            )}
          </div>
        </div>

        {data.content && (
          <div className="project-description">
            <h1>About the project</h1>

            {data.content.map((mdString, i) => (
              <ReactMarkdown key={`content_${i}`} source={mdString} />
            ))}
          </div>
        )}

        <div className="columns project-extended-info">
          {data.maintainer && (
            <div className="column">
              <h6>Maintainer</h6>
              <Link to={data.maintainer.path}>{data.maintainer.data.name}</Link>
            </div>
          )}

          {people && people.length > 0 && (
            <div className="column staff-list">
              <h6>Staff</h6>

              {people
                .filter(
                  p =>
                    !data.maintainer ||
                    (data.maintainer && data.maintainer.path !== p.path)
                )
                .map(person => (
                  <Link key={person.path} to={person.path}>
                    {person.name}
                  </Link>
                ))}
            </div>
          )}

          {data.partner && (
            <div className="column staff-list">
              <h6>Partners</h6>

              {data.partner.map(partner => (
                <a key={partner.id} href={partner.data.url}>
                  {partner.data.name}
                </a>
              ))}
            </div>
          )}

          {data.fundingProgram && (
            <div className="column">
              <h6>Funding program</h6>

              {data.fundingProgram}
            </div>
          )}
        </div>

        <div className="horizontal-separator" />

        {(data.relatedDemo || data.relatedProject) && (
          <div className="see-also">
            <h2>See also</h2>

            <div className="columns is-multiline is-5 is-variable">
              {data.relatedProject &&
                data.relatedProject.map(proj => (
                  <div className="column is-one-third" key={proj.id}>
                    <Project project={proj} />
                  </div>
                ))}
              {data.relatedDemo &&
                data.relatedDemo.map(demo => (
                  <div className="column is-one-third" key={demo.id}>
                    <Demo node={demo} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    rdf(path: { eq: $path }) {
      data {
        rdf_type {
          data {
            name
          }
        }
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
            logo
            screenshot
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
