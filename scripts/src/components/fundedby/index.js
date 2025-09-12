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
const uniq = arr => Array.from(new Set(arr));

const useFunders = fundingProgram => {
  const {
    allRdf: { edges },
  } = useStaticQuery(query);

  const funders = useMemo(
    () =>
      edges.map(({ node }) => {
        const allImgs = uniq(
          [
            ...(Array.isArray(node.data.image) ? node.data.image : []),
            node.data.logo,
          ].filter(Boolean)
        );
        return {
          url: node.data.url,
          images: allImgs,
          texts: [node.data.name].concat(node.data.text || []).filter(Boolean),
        };
      }),
    [edges]
  );

  const fp = normalize(fundingProgram);
  if (!fundingProgram) return funders;
  return funders.filter(f => f.texts.some(t => fp.includes(normalize(t))));
};

const FundedBy = ({ fundingProgram, funders: linkedFunders }) => {
  const allFunders = useFunders(null);

  const hasLinked = Array.isArray(linkedFunders) && linkedFunders.length > 0;

  const byLink = hasLinked
    ? linkedFunders.map(n => ({
        url: n.data.url,
        images: (Array.isArray(n.data.image) && n.data.image.length
          ? n.data.image
          : [n.data.logo]
        ).filter(Boolean),
        texts: [n.data.name].concat(n.data.text || []).filter(Boolean),
      }))
    : [];

  const byAlias = fundingProgram ? useFunders(fundingProgram) : [];

  const isHomepage = !hasLinked && fundingProgram == null;

  const merged = [...byLink, ...byAlias];
  const base = merged.length ? merged : isHomepage ? allFunders : [];

  const seen = new Set();
  const funders = base.filter(f => {
    const k = f.url || f.texts[0];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (funders.length === 0) return null;

  if (isHomepage) {
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
  }

  return (
    <div>
      <div>
        {funders.map((funder, i) =>
          funder.images.map((img, j) => (
            <div
              className="funder-logo"
              key={`{funder.url || funder.texts[0]}-${i}-${j}`}
            >
              <a href={funder.url} target="_blank" rel="noopener noreferrer">
                <Image
                  filename={img}
                  alt={funder.texts[0]}
                  style={{ width: 100 }}
                />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FundedBy;
