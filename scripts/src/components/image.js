import { graphql, useStaticQuery } from 'gatsby';
import Img from 'gatsby-image';
import React from 'react';
import DICE from './svgs/dice.inline.svg';

const Image = ({ filename, alt, style, className = 'image' }) => {
  // pre-calculate all images data
  // this is required because currently Gatsby don't understand
  // dynamic queries on the build time
  const {
    allImageSharp: { edges: images },
    svgs: { edges: svgs },
  } = useStaticQuery(graphql`
    query {
      svgs: allFile(filter: { extension: { eq: "svg" } }) {
        edges {
          node {
            extension
            publicURL
          }
        }
      }

      allImageSharp {
        edges {
          node {
            fluid(maxWidth: 1000, quality: 100) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    }
  `);

  // find image that user wanted by matching path end
  const imageEl =
    filename && filename.length > 0
      ? images.find(element => element.node.fluid.src.endsWith(`/${filename}`))
      : undefined;

  // find svg that user wanted by matching public URL end
  const svgEl =
    filename && filename.length > 0
      ? svgs.find(element => element.node.publicURL.endsWith(filename))
      : undefined;

  // if image not found - return DICE logo placeholder
  if (!imageEl && !svgEl) {
    return (
      <DICE
        viewBox="0 0 700 763"
        height="100%"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }

  // render image if present
  if (imageEl) {
    const image = imageEl.node.fluid;
    return (
      <Img
        className={className}
        fluid={image}
        objectFit="cover"
        alt={alt}
        style={style}
      />
    );
  }

  // render svg
  if (svgEl) {
    const svgPath = svgEl.node.publicURL;
    return <img src={svgPath} alt={alt} style={style} />;
  }

  // if for some reason svg and image were found but not rendered
  // return dice placeholder
  return (
    <DICE
      viewBox="0 0 700 763"
      height="100%"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
    />
  );
};

export default React.memo(Image);
