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

        <p>
          Webpage: <a href={data.webpage}>{data.webpage}</a>
        </p>
        <p>
          Maintainer:{' '}
          <Link to={data.maintainer.path}>{data.maintainer.data.name}</Link>
        </p>
        <p>
          Developers:{' '}
          {data.developer.map(p => (
            <Link key={p.path} to={p.path}>
              {p.data.name}
            </Link>
          ))}
        </p>

        <h2>Description:</h2>
        <p>{data.description}</p>

        <h2>Screenshots:</h2>

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
