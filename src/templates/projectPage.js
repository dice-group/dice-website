import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Image from '../components/image';
import Layout from '../components/layout';
import { Person, rdfToPeopleArray } from '../components/person';
import SEO from '../components/seo';

export default function Template({
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

        <div
          className="image"
          style={{ width: 100, height: 100, overflow: 'hidden' }}
        >
          <Image filename={data.logo} alt={`${data.name} logo`} />
        </div>

        <p>
          Homepage: <a href={data.homepage}>{data.homepage}</a>
        </p>
        <p>
          Source code: <a href={data.sourceCode}>{data.sourceCode}</a>
        </p>
        <p>Status: {data.status}</p>
        <p>Start date: {data.startDate}</p>
        <p>End date: {data.endDate}</p>
        <p>Funding program: {data.fundingProgram}</p>

        <p>
          Maintainer:{' '}
          <Link to={data.maintainer.path}>{data.maintainer.data.name}</Link>{' '}
        </p>

        <h2>Description:</h2>
        <div style={{ paddingBottom: 30 }}>
          {data.content &&
            data.content.map(mdString => <ReactMarkdown source={mdString} />)}
        </div>

        <h2>Partners:</h2>

        <div className="tile is-ancestor" style={{ padding: 30 }}>
          {data.partner.map(partner => (
            <div key={partner.id} className="tile">
              <div className="image is-64x64" style={{ marginRight: 10 }}>
                <Image filename={partner.data.logo} />
              </div>
              <a href={partner.data.url}>{partner.data.name}</a>
            </div>
          ))}
        </div>

        <h2>Related projects:</h2>

        <div className="tile is-ancestor" style={{ padding: 30 }}>
          {data.relatedProject.map(proj => (
            <div key={proj.id} className="tile">
              <h3>
                <Link to={proj.path}>{proj.data.name}</Link>
              </h3>
            </div>
          ))}
        </div>

        <h2>Staff:</h2>
        <div className="tile is-ancestor" style={{ flexWrap: 'wrap' }}>
          {people.map(person => (
            <div className="tile is-4">
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
            name
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
