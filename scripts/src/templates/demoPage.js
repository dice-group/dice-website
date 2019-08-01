import { graphql, Link } from 'gatsby';
import React from 'react';
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
      <div className="content">
        <h1>{data.name}</h1>

        <div className="is-flex" style={{ padding: 10 }}>
          <div
            className="is-flex data-column data-header"
            style={{
              textAlign: 'right',
            }}
          >
            {data.webpage && <div>Webpage:</div>}
            {data.maintainer && <div>Maintainer:</div>}
            {data.developer && <div>Developers:</div>}
          </div>
          <div className="is-flex data-column">
            {data.webpage && (
              <div>
                <a href={data.webpage}>{data.webpage}</a>
              </div>
            )}
            {data.maintainer && (
              <div>
                <Link to={data.maintainer.path}>
                  {data.maintainer.data.name}
                </Link>
              </div>
            )}
            {data.developer && (
              <div>
                <ul className="people-list">
                  {data.developer.map(p => (
                    <li key={p.path}>
                      <Link key={p.path} to={p.path}>
                        {p.data.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <h1>Description</h1>
        <p>{data.description}</p>

        <h1>Screenshots</h1>

        <div className="tile is-ancestor">
          {data.screenshot.map((screen, index) => (
            <div key={screen} className="tile is-parent">
              <Image
                filename={screen}
                alt={`${data.name} screenshot ${index + 1}`}
                style={{ width: '100%', height: '100%' }}
              />
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
  }
`;
