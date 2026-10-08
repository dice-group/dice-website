import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from '../components/markdown';
import BackButton from '../components/backButton';
import Layout from '../components/layout';
import PapersList from '../components/papers/list';
import PersonInfo from '../components/personInfo';
import SEO from '../components/seo';

export default function PersonTemplate({ data: { rdf } }) {
  const {
    path,
    data: { content, name, namePrefix, project, publicationTag },
  } = rdf;

  return (
    <Layout>
      <SEO title={`${namePrefix} ${name}`} />
      <div className="content person-page">
        <BackButton />

        <h1 className="header">Profile page</h1>

        <PersonInfo data={rdf.data} />
        {content && (
          <div className="person-content">
            {content.map((mdString, i) => (
              <ReactMarkdown key={`content_${i}`} source={mdString} />
            ))}
          </div>
        )}

        {project && (
          <>
            <h1>Projects</h1>
            <div className="projects">
              {project
                .sort((a, b) => a.data.name.localeCompare(b.data.name))
                .map(p => (
                  <Link key={p.path} to={p.path}>
                    {p.data.name} – {p.data.tagline}
                  </Link>
                ))}
            </div>
          </>
        )}

        <h1>Publications</h1>
        <PapersList name={name} publicationTag={publicationTag} path={path} />
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    rdf(path: { eq: $path }) {
      path
      data {
        name
        namePrefix
        phone
        fax
        email
        chat
        office
        photo
        content
        publicationTag
        sameAs
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
            tagline
          }
        }
      }
    }
  }
`;
