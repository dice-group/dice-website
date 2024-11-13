import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from '../components/markdown';
import BackButton from '../components/backButton';
import Image from '../components/image';
import Layout from '../components/layout';
import PapersList from '../components/papers/list';
import Phone from '../components/phone';
import SEO from '../components/seo';

export default function PersonTemplate({ data: { rdf } }) {
  const {
    path,
    data: {
      content,
      name,
      namePrefix,
      role,
      project,
      phone,
      fax,
      email,
      chat,
      office,
      photo,
      publicationTag,
    },
  } = rdf;

  return (
    <Layout>
      <SEO title={`${namePrefix} ${name}`} />
      <div className="content person-page">
        <BackButton />

        <h1 className="header">Profile page</h1>

        <div className="person-info">
          <div className="person-image">
            <Image
              filename={photo}
              alt={`${namePrefix} ${name} photo`}
              style={{ width: 300 }}
            />
          </div>

          <div className="person-data">
            <h2>
              {namePrefix} {name}
            </h2>
            <p className="role">{role.data.name}</p>
            {email && (
              <div className="meta">
                <div className="meta-label">Email</div>
                <div className="meta-value">
                  <a href={email}>{email.replace('mailto:', '')}</a>
                </div>
              </div>
            )}
            {chat && (
              <div className="meta">
                <div className="meta-label">Matrix (chat)</div>
                <div className="meta-value">
                  <a href={`https://riot.im/app/#/user/${chat}`}>{chat}</a>
                </div>
              </div>
            )}
            {phone && phone.replace('tel:', '') && (
              <div className="meta">
                <div className="meta-label">Phone</div>
                <div className="meta-value">
                  <Phone phone={phone} />
                </div>
              </div>
            )}
            {fax && fax.replace('tel:', '') && (
              <div className="meta">
                <div className="meta-label">Fax</div>
                <div className="meta-value">
                  <Phone phone={fax} />
                </div>
              </div>
            )}
            {office && (
              <div className="meta">
                <div className="meta-label">Office</div>
                <div className="meta-value">{office}</div>
              </div>
            )}
          </div>
        </div>
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
