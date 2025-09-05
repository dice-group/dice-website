import format from 'date-fns/format';
import { graphql, Link } from 'gatsby';
import React from 'react';
import BackButton from '../components/backButton';
import Demo from '../components/demo';
import Image from '../components/image';
import Layout from '../components/layout';
import ReactMarkdown from '../components/markdown';
import PapersList from '../components/papers/list';
import { rdfToPeopleArray } from '../components/person';
import Project from '../components/project';
import SEO from '../components/seo';
import FundedBy from '../components/fundedby';

const dateFormat = 'MMMM yyyy';

const printDates = ({ startDate, endDate }) => {
  if (startDate && endDate) {
    return `(${format(new Date(startDate), dateFormat)} - ${format(
      new Date(endDate),
      dateFormat
    )})`;
  }

  if (startDate && !endDate) {
    return `(${format(new Date(startDate), dateFormat)} - Ongoing)`;
  }

  return '';
};

export default function ProjectTemplate({
  data: {
    rdf: { data },
    allRdf: { edges },
  },
}) {
  const people = rdfToPeopleArray(edges);

  return (
    <Layout>
      <SEO title={`${data.name}`} jsonld={data.jsonld} />
      <div className="project content">
        <BackButton />

        <h1 className="header">{data.name}</h1>

        <p className="subtitle">
          {data.rdf_type[0].data.name} {printDates(data)}
        </p>

        <div className="project-card">
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
              <a href={data.homepage} className="button">
                Homepage
              </a>
            )}
            {data.sourceCode && (
              <a href={data.sourceCode} className="button is-outlined">
                Source code
              </a>
            )}
          </div>
        </div>

        {data.content && (
          <div className="project-description">
            <h1 className="subheader">About the project</h1>

            {data.content.map((mdString, i) => (
              <ReactMarkdown key={`content_${i}`} source={mdString} />
            ))}
          </div>
        )}

        {data.fundingProgram && (
          <div>
            <h6 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>
              Funding program
            </h6>
            <p style={{ marginBottom: '0.5rem' }}>{data.fundingProgram}</p>
            <FundedBy fundingProgram={data.fundingProgram} />
          </div>
        )}

        <div className="columns project-extended-info">
          {data.maintainer && (
            <div className="column">
              <h6 className="column-header">Maintainer</h6>
              <Link to={data.maintainer.path}>{data.maintainer.data.name}</Link>
            </div>
          )}

          {people && people.length > 0 && (
            <div className="column staff-list">
              <h6 className="column-header">Staff</h6>

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
              <h6 className="column-header">Partners</h6>

              {data.partner.map(partner => (
                <a key={partner.id} href={partner.data.url}>
                  {partner.data.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="horizontal-separator" />

        {(data.relatedDemo || data.relatedProject) && (
          <div className="see-also">
            <h2 className="subheader">See also</h2>

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

        {data.publicationTag && data.publicationTag.length > 0 && (
          <div>
            <h1>Publications</h1>
            <PapersList publicationTag={data.publicationTag} />
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
        jsonld
        fundingProgram
        publicationTag
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
