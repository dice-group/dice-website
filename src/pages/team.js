import { graphql } from 'gatsby';
import _ from 'lodash';
import React from 'react';
import Layout from '../components/layout';
import { Person, rdfToPeopleArray } from '../components/person';
import SEO from '../components/seo';

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
      filter: {
        data: {
          rdf_type: {
            elemMatch: { id: { eq: "https://schema.dice-research.org/Person" } }
          }
        }
      }
    ) {
      edges {
        node {
          path
          data {
            name
            email
            project {
              path
              data {
                name
              }
            }
            role {
              data {
                name
                priority
              }
            }
          }
        }
      }
    }
  }
`;
