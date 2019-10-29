import { graphql, useStaticQuery } from 'gatsby';
import React from 'react';
import Image from '../image';
import Phone from '../phone';

const contactsQuery = graphql`
  {
    allRdf(
      filter: {
        data: {
          rdf_type: {
            elemMatch: { id: { eq: "https://schema.dice-research.org/Person" } }
          }
          role: {
            id: {
              in: [
                "https://dice-research.org/Head"
                "https://dice-research.org/Secretary"
              ]
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
            phone
            email
            photo
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

const ContactForm = () => {
  const {
    allRdf: { edges },
  } = useStaticQuery(contactsQuery);

  const axelProfile = edges.find(
    ({ node }) => node.data.role.data.name === 'Head'
  ).node;
  const simoneProfile = edges.find(
    ({ node }) => node.data.role.data.name === 'Secretary'
  ).node;

  return (
    <div className="contacts">
      <div className="column">
        <div className="round-image">
          <Image
            filename={axelProfile.data.photo}
            alt={`${axelProfile.data.name} photo`}
          />
        </div>
        <p className="property-name">Head of DICE</p>
        <p className="property-value">
          {axelProfile.data.namePrefix} {axelProfile.data.name}
        </p>

        <p className="property-name">Email</p>
        <a className="property-value brand-color" href={axelProfile.data.email}>
          {axelProfile.data.email.replace('mailto:', '')}
        </a>

        <p className="property-name">Phone</p>
        <p className="property-value">
          <Phone phone={axelProfile.data.phone} />
        </p>
      </div>
      <div className="column">
        <div className="round-image">
          <Image
            filename={simoneProfile.data.photo}
            alt={`${simoneProfile.data.name} photo`}
          />
        </div>
        <p className="property-name">{simoneProfile.data.role.data.name}</p>
        <p className="property-value">
          {simoneProfile.data.namePrefix} {simoneProfile.data.name}
        </p>

        <p className="property-name">Email</p>
        <a
          className="property-value brand-color"
          href={simoneProfile.data.email}
        >
          {simoneProfile.data.email.replace('mailto:', '')}
        </a>

        <p className="property-name">Phone</p>
        <p className="property-value">
          <Phone phone={simoneProfile.data.phone} />
        </p>
      </div>
    </div>
  );
};

export default ContactForm;
