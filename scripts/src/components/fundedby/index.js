import React, { useMemo } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import Image from '../image';

const query = graphql`
  {
    allRdf(
      filter: {
        data: {
          rdf_type: {
            elemMatch: { id: { eq: "https://schema.dice-research.org/Funder" } }
          }
        }
      }
    ) {
      edges {
        node {
          id
          data {
            name
            url
            logo
            text
            image
          }
        }
      }
    }
  }
`;

const normalize = s => (s || '').toLowerCase();

const useFunders = fundingProgram => {
  const {
    allRdf: { edges },
  } = useStaticQuery(query);
  const funders = useMemo(
    () =>
      edges.map(({ node }) => ({
        url: node.data.url,
        images:
          Array.isArray(node.data.image) && node.data.image.length
            ? node.data.image
            : [node.data.logo].filter(Boolean),
        texts: [node.data.name].concat(node.data.text || []).filter(Boolean),
      })),
    [edges]
  );

  const fp = normalize(fundingProgram);
  if (!fundingProgram) return funders;
  return funders.filter(f => f.texts.some(t => fp.includes(normalize(t))));
};

const FundedBy = ({ fundingProgram }) => {
  const funders = useFunders(fundingProgram);

  if (fundingProgram) {
    return (
      <div>
        <div>
          {funders.map(funder =>
            funder.images.map((img, i) => (
              <span
                style={{ display: 'inline-block', verticalAlign: 'middle' }}
                key={`${funder.url}-${i}`}
              >
                <a href={funder.url} target="_blank" rel="noopener noreferrer">
                  <Image filename={img} style={{ width: 100 }} />
                </a>
              </span>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="columns is-padded">
        {funders.map(funder => (
          <div key={funder.url} className="column funded-by-item">
            <a href={funder.url} target="_blank" rel="noopener noreferrer">
              <Image
                filename={funder.images[0]}
                alt={funder.texts[0]}
                style={{ width: 100 }}
              />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FundedBy;
