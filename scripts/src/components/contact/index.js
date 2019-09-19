import { graphql, useStaticQuery } from 'gatsby';
import React from 'react';
import Image from '../image';

const axelQuery = graphql`
  {
    allRdf(
      filter: {
        data: {
          rdf_type: {
            elemMatch: { id: { eq: "https://schema.dice-research.org/Person" } }
          }
          role: { id: { eq: "https://dice-research.org/Head" } }
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
            fax
            email
            office
            photo
            content
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

const ContactForm = () => {
  const {
    allRdf: {
      edges: [{ node: axelProfile }],
    },
  } = useStaticQuery(axelQuery);

  return (
    <div className="columns">
      <style jsx>{`
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
      <div className="column is-one-quarter">
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
      <div className="column form-column is-flex">
        <input type="text" className="input" placeholder="Your name" />
        <input type="text" className="input" placeholder="Email" />
        <input
          type="text"
          className="input"
          placeholder="Contact phone (optional)"
        />
        <input
          type="text"
          className="input"
          placeholder="Company name (optional)"
        />
        <textarea className="input" placeholder="Your message" />
        <div>
          <button
            className="button is-link action-button"
            style={{ height: 50 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
