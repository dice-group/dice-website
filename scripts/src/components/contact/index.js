import { graphql, useStaticQuery } from 'gatsby';
import React from 'react';
import Image from '../image';

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
    <div className="columns">
      <style jsx>{`
        .column {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .round-image {
          width: 200px;
          height: 200px;
          border-radius: 100px;
          overflow: hidden;
        }

        .property-name {
          padding-top: 20px;
          margin-bottom: 5px !important;
          font-weight: normal;
        }

        .property-value {
          font-weight: 500;
          padding-top: 0;
          margin-bottom: 0 !important;
        }

        .form-column {
          flex-direction: column;
          justify-content: center;
        }
      `}</style>
      <div className="column is-half">
        <div className="round-image">
          <Image
            filename={axelProfile.data.photo}
            alt={`${axelProfile.data.name} photo`}
          />
        </div>
        <p className="property-name has-text-grey-light">Head of DICE</p>
        <p className="property-value">
          {axelProfile.data.namePrefix} {axelProfile.data.name}
        </p>

        <p className="property-name has-text-grey-light">Email</p>
        <a className="property-value brand-color" href={axelProfile.data.email}>
          {axelProfile.data.email.replace('mailto:', '')}
        </a>

        <p className="property-name has-text-grey-light">Phone</p>
        <p className="property-value">
          {axelProfile.data.phone.replace('tel:', '')}
        </p>
      </div>
      <div className="column is-half">
        <div className="round-image">
          <Image
            filename={simoneProfile.data.photo}
            alt={`${simoneProfile.data.name} photo`}
          />
        </div>
        <p className="property-name has-text-grey-light">
          {simoneProfile.data.role.data.name}
        </p>
        <p className="property-value">
          {simoneProfile.data.namePrefix} {simoneProfile.data.name}
        </p>

        <p className="property-name has-text-grey-light">Email</p>
        <a
          className="property-value brand-color"
          href={simoneProfile.data.email}
        >
          {simoneProfile.data.email.replace('mailto:', '')}
        </a>

        <p className="property-name has-text-grey-light">Phone</p>
        <p className="property-value">
          {simoneProfile.data.phone.replace('tel:', '')}
        </p>
      </div>
    </div>
  );
};

export default ContactForm;
