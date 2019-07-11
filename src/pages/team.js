import _ from 'lodash';
import React from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/layout';
import SEO from '../components/seo';
import { Person, rdfToPeopleArray } from '../components/person';

export default function Template({
  data: {
    allRdf: { edges },
  },
}) {
  const people = rdfToPeopleArray(edges);

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
                <Person key={person.path} person={person} />
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
