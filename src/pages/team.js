import _ from 'lodash';
import React from 'react';
import { graphql, Link } from 'gatsby';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Template({
  data: {
    allRdf: { edges },
  },
}) {
  const people = edges
    .map(n => n.node)
    .map(({ data, path }) => ({
      name: data.foaf_name,
      email: data.foaf_mbox,
      path: path,
      projects: data.website_project.map(p => ({
        name: p.data.rdfs_label,
        path: p.path,
      })),
      role: {
        name: data.website_role.data.rdfs_label,
        priority: data.website_role.data.websiteSchema_priority,
      },
    }));

  const peopleByRole = _.groupBy(
    _.sortBy(people, 'role.priority'),
    p => p.role.name
  );

  return (
    <Layout>
      <SEO title="Team" />
      <div>
        {Object.keys(peopleByRole).map(role => (
          <div style={{ paddingTop: 10 }} key={role}>
            <h2>{role}</h2>
            <div>
              {peopleByRole[role].map(person => (
                <div style={{ padding: 20 }} key={person.name}>
                  Name: <Link to={person.path}>{person.name}</Link>
                  <br />
                  Email: {person.email}
                  <br />
                  Projects:{' '}
                  {person.projects.map(p => (
                    <Link style={{ paddingRight: 10 }} to={`/${p.path}`}>
                      {p.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allRdf(
      filter: { data: { rdf_type: { eq: "http://xmlns.com/foaf/0.1/Person" } } }
    ) {
      edges {
        node {
          path
          data {
            foaf_name
            foaf_mbox
            website_project {
              path
              data {
                rdfs_label
              }
            }
            website_role {
              data {
                rdfs_label
                websiteSchema_priority
              }
            }
          }
        }
      }
    }
  }
`;
