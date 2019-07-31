import { graphql, Link, useStaticQuery } from 'gatsby';
import React from 'react';
import { rdfToPerson } from './index';

const DynamicPerson = ({ id }) => {
  // pre-calculate all people data
  // this is required because currently Gatsby don't understand
  // dynamic queries on the build time
  const {
    allRdf: { edges: people },
  } = useStaticQuery(graphql`
    query {
      allRdf(
        filter: {
          data: {
            rdf_type: {
              elemMatch: {
                id: { eq: "https://schema.dice-research.org/Person" }
              }
            }
          }
        }
      ) {
        edges {
          node {
            path
            data {
              name
              namePrefix
              photo
            }
          }
        }
      }
    }
  `);

  const personId = id.replace('dice:', '/');
  const { node: personData } = people.find(p => p.node.path === personId);
  const person = rdfToPerson(personData);

  return (
    <Link to={person.path}>
      {person.namePrefix} {person.name}
    </Link>
  );
};

export default DynamicPerson;
