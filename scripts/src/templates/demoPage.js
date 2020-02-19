import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import ReactMarkdownHTML from '../components/markdown';
import BackButton from '../components/backButton';
import Image from '../components/image';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function DemoTemplate({
  data: {
    rdf: { data },
  },
}) {
  return (
    <Layout>
      <SEO title={`${data.name}`} />
      <div className="content project demo" style={{ marginBottom: 160 }}>
        <BackButton />

        <h1 className="title">{data.name}</h1>

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

        {(data.content || data.contenthtml) && (
          <div className="project-description">
            <h1 className="subheader">About the demo</h1>

            {data.content &&
              data.content.map((mdString, i) => (
                <ReactMarkdown key={`content_${i}`} source={mdString} />
              ))}
            {data.contenthtml &&
              data.contenthtml.map((mdString, i) => (
                <ReactMarkdownHTML
                  key={`content_html_${i}`}
                  source={mdString}
                />
              ))}
          </div>
        )}

        <div className="flex flex-col">
          {data.screenshot.map((screen, index) => (
            <div key={screen} className="flex p-4 w-full">
              <Image
                filename={screen}
                alt={`${data.name} screenshot ${index + 1}`}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ))}
        </div>

        <div className="columns project-extended-info">
          {data.maintainer && (
            <div className="column">
              <h6 className="column-header">Maintainer</h6>
              <Link to={data.maintainer.path}>{data.maintainer.data.name}</Link>
            </div>
          )}

          {data.developer && data.developer.length > 0 && (
            <div className="column staff-list">
              <h6 className="column-header">Staff</h6>

              {data.developer
                .filter(
                  p =>
                    !data.maintainer ||
                    (data.maintainer && data.maintainer.path !== p.path)
                )
                .map(person => (
                  <Link key={person.path} to={person.path}>
                    {person.data.name}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    rdf(path: { eq: $path }) {
      data {
        name
        tagline
        content
        contenthtml
        logo
        screenshot
        homepage
        sourceCode
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
  }
`;
