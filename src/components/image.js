import { graphql, useStaticQuery } from 'gatsby';
import Img from 'gatsby-image';
import React from 'react';

const Image = ({ filename, alt, style }) => {
  // pre-calculate all images data
  // this is required because currently Gatsby don't understand
  // dynamic queries on the build time
  const {
    allImageSharp: { edges: images },
  } = useStaticQuery(graphql`
    query {
      allImageSharp {
        edges {
          node {
            fluid(maxWidth: 1000, quality: 100) {
              ...GatsbyImageSharpFluid
              originalName
            }
          }
        }
      }
    }
  `);

  // find image that user wanted
  const image = images.find(element => {
    // Match string after final slash
    return element.node.fluid.originalName === filename;
  }).node.fluid;

  return (
    <Img
      className="image"
      fluid={image}
      objectFit="cover"
      alt={alt}
      style={style}
    />
  );
};

export default Image;
