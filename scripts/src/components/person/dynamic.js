import { graphql, Link, useStaticQuery } from 'gatsby';
import React from 'react';
import { rdfToPerson } from './index';

const DynamicPerson = ({ id, name, className, style }) => {
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

  let personData;

  if (id && id.length) {
    const personId = id.replace('dice:', '/');
    const res = people.find(p => p.node.path === personId);
    if (res) {
      personData = res.node;
    }
  }

  if (name && name.length) {
    const res = people.find(p =>
      p.node.data.name.toLowerCase().includes(name.toLowerCase())
    );
    if (res) {
      personData = res.node;
    }
  }

  // if nothing found - return empty div
  if (!personData) {
    return <div />;
  }

  const person = rdfToPerson(personData);

  return (
    <Link to={person.path} className={className} style={style}>
      {person.namePrefix} {person.name}
    </Link>
  );
};

export default DynamicPerson;
