import { graphql, Link } from 'gatsby';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import CollaboratorsNav from '../../components/collabnav';
import Layout from '../../components/layout';
import SEO from '../../components/seo';
import SideMenu from '../../components/sidemenu';

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
      <CollaboratorsNav activeLink="/collaborators/groups/" />
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

              <p>
                {node.data.content.map((mdString, i) => (
                  <ReactMarkdown
                    key={`content_${i}`}
                    source={mdString}
                    escapeHtml={false}
                  />
                ))}
              </p>

              <div className="columns project-extended-info">
                {node.data.lead && (
                  <div className="column">
                    <h6 className="column-header">Lead</h6>
                    <Link to={node.data.lead.path}>
                      {node.data.lead.data.name}
                    </Link>
                  </div>
                )}

                {node.data.member && node.data.member.length > 0 && (
                  <div className="column staff-list">
                    <h6 className="column-header">Members</h6>

                    {node.data.member.map(person => (
                      <Link key={person.path} to={person.path}>
                        {person.data.name}
                      </Link>
                    ))}
                  </div>
                )}

                {node.data.relatedProject &&
                  node.data.relatedProject.length > 0 && (
                    <div className="column staff-list">
                      <h6 className="column-header">Projects</h6>

                      {node.data.relatedProject.map(project => (
                        <a key={project.path} href={project.path}>
                          {project.data.name}
                        </a>
                      ))}
                    </div>
                  )}

                {node.data.relatedDemo && node.data.relatedDemo.length > 0 && (
                  <div className="column staff-list">
                    <h6 className="column-header">Demos</h6>

                    {node.data.relatedDemo.map(project => (
                      <a key={project.path} href={project.path}>
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
