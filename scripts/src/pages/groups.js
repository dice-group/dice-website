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
    url: node.data.name.toLowerCase(),
  }));

  return (
    <Layout withContainer={false}>
      <SEO title="Groups" />
      <ResearchNav activeLink="/collaborators/groups/" />
      <SideMenu targets={menu} style={{ margin: 'auto' }} />

      <section className="section">
        <div className="container content">
          <h1 className="header">Groups</h1>

          {data.map(({ node }) => (
            <div
              className="project"
              id={node.data.name.toLowerCase()}
              key={node.id}
            >
              <h2
                className="subheader"
                ref={menu.find(it => it.title === node.data.name).target}
              >
                {node.data.name}
              </h2>

              <div>
                {node.data.content.map((mdString, i) => (
                  <ReactMarkdown key={`content_${i}`} source={mdString} />
                ))}
              </div>

              <div className="columns project-extended-info">
                {node.data.lead && (
                  <div className="column">
                    <h6 className="column-header">Lead</h6>
                    <Link className="break-normal" to={node.data.lead.path}>
                      {node.data.lead.data.name}
                    </Link>
                  </div>
                )}

                {node.data.member && node.data.member.length > 0 && (
                  <div className="column staff-list">
                    <h6 className="column-header">Members</h6>

                    {node.data.member
                      .filter(
                        person => person.data.role?.data?.name !== 'Alumni'
                      )
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

                {node.data?.member.some(
                  person => person.data.role?.data?.name === 'Alumni'
                ) && (
                  <div className="column staff-list">
                    <h6 className="column-header">Alumni</h6>

                    {node.data.member
                      .filter(
                        person => person.data.role?.data?.name === 'Alumni'
                      )
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
                {node.data?.relatedProject.some(
                  project =>
                    project.data.rdf_type[0].id !==
                    'https://dice-research.org/AlumniProject'
                ) && (
                  <div className="column staff-list">
                    <h6 className="column-header">Projects</h6>

                    {node.data.relatedProject
                      .filter(project =>
                        project.data.rdf_type?.some(
                          type =>
                            type.id !==
                            'https://dice-research.org/AlumniProject'
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

                {node.data?.relatedProject.some(
                  project =>
                    project.data.rdf_type[0].id ===
                    'https://dice-research.org/AlumniProject'
                ) && (
                  <div className="column staff-list">
                    <h6 className="column-header">Alumni Projects</h6>

                    {node.data.relatedProject
                      .filter(project =>
                        project.data.rdf_type?.some(
                          type =>
                            type.id ===
                            'https://dice-research.org/AlumniProject'
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

                {node.data.relatedDemo && node.data.relatedDemo.length > 0 && (
                  <div className="column staff-list">
                    <h6 className="column-header">Demos</h6>

                    {node.data.relatedDemo.map(project => (
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
              </div>

              <div className="horizontal-separator" />
            </div>
          ))}
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
