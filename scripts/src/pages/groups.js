import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from '../components/markdown';
import ResearchNav from '../components/researchnav';
import Layout from '../components/layout';
import SEO from '../components/seo';
import SideMenu from '../components/sidemenu';

export default function Groups({
  data: {
    allRdf: { edges },
  },
}) {
  const data = edges.sort((a, b) =>
    a.node.data.name.localeCompare(b.node.data.name)
  );

  const menu = data.map(({ node }) => ({
    target: React.createRef(),
    title: node.data.name,
    url: node.data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
  }));

  const refsByName = Object.fromEntries(menu.map(m => [m.title, m.target]));

  return (
    <Layout withContainer={false}>
      <SEO title="Groups" />
      <ResearchNav activeLink="/research/groups/" />
      <SideMenu targets={menu} style={{ margin: 'auto' }} />

      <section className="section groups-page">
        <div className="container content">
          <h1 className="header">Research Groups</h1>

          {data.map(({ node }) => {
            const rawImg = node?.data?.image ?? node?.data?.logo;
            const img = Array.isArray(rawImg) ? rawImg[0] : rawImg;
            const imgSrc = img
              ? `/images/groups/${img}`
              : '/images/groups/group-placeholder.png';

            return (
              <div
                className="group-card"
                id={node.data.name
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '')}
                key={node.id}
              >
                <div className="group-header">
                  <div className="group-figure">
                    <img
                      src={imgSrc}
                      alt={`${node.data.name} illustration`}
                      loading="lazy"
                    />
                  </div>

                  <div className="group-body">
                    <h2
                      className="group-title"
                      ref={refsByName[node.data.name]}
                    >
                      {node.data.name}
                    </h2>

                    {node.data.tagline && (
                      <p className="group-tagline">{node.data.tagline}</p>
                    )}

                    {(node.data.content ?? []).map((mdString, i) => (
                      <ReactMarkdown key={`content_${i}`} source={mdString} />
                    ))}
                  </div>
                </div>

                <div className="meta-grid">
                  {node.data.lead && (
                    <div>
                      <h6 className="column-header">Lead</h6>
                      <Link className="break-normal" to={node.data.lead.path}>
                        {node.data.lead.data.name}
                      </Link>
                    </div>
                  )}

                  {node.data.member && node.data.member.length > 0 && (
                    <div className="staff-list">
                      <h6 className="column-header">Members</h6>
                      {node.data.member
                        .filter(p => p.data.role?.data?.name !== 'Alumni')
                        .map(person => (
                          <Link
                            className="break-normal"
                            key={person.path}
                            to={person.path}
                          >
                            {person.data.name}
                          </Link>
                        ))}
                    </div>
                  )}

                  {node.data?.relatedProject?.some(prj =>
                    prj.data.rdf_type?.every(
                      t => t.id !== 'https://dice-research.org/AlumniProject'
                    )
                  ) && (
                    <div className="staff-list">
                      <h6 className="column-header">Projects</h6>
                      {node.data.relatedProject
                        .filter(prj =>
                          prj.data.rdf_type?.every(
                            t =>
                              t.id !== 'https://dice-research.org/AlumniProject'
                          )
                        )
                        .map(project => (
                          <a
                            className="break-normal"
                            key={project.path}
                            href={project.path}
                          >
                            {project.data.name}
                          </a>
                        ))}
                    </div>
                  )}

                  {node.data?.relatedDemo?.length > 0 && (
                    <div className="staff-list">
                      <h6 className="column-header">Demos</h6>
                      {node.data.relatedDemo.map(demo => (
                        <a
                          className="break-normal"
                          key={demo.path}
                          href={demo.path}
                        >
                          {demo.data.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allRdf(
      filter: {
        data: {
          rdf_type: {
            elemMatch: { id: { eq: "https://schema.dice-research.org/Group" } }
          }
        }
      }
    ) {
      edges {
        node {
          id
          data {
            name
            image
            logo
            tagline
            relatedProject {
              path
              data {
                name
                status
                rdf_type {
                  id
                }
              }
            }
            content
            lead {
              path
              data {
                name
              }
            }
            member {
              path
              data {
                name
                role {
                  data {
                    name
                  }
                }
              }
            }
            relatedDemo {
              path
              data {
                name
              }
            }
          }
        }
      }
    }
  }
`;
