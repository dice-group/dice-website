const path = require('path');

module.exports = {
  siteMetadata: {
    title: `DICE Research Group`,
    description: `The Data Science (DICE) group develops methods, algorithms and applications for the extraction, integration, storage, querying, access and consumption of large-scale datasets.`,
    author: `@yamalight`,
  },
  plugins: [
    // RDF processing
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `rdfData`,
        path: `${__dirname}/../data`,
      },
    },
    `gatsby-transformer-rdf`,

    // mdx processing
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/../pages`,
      },
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              icon: false,
            },
          },
        ],
      },
    },
    // support for embeds from third-parties
    `@pauliescanlon/gatsby-mdx-embed`,

    // svg inlining
    {
      resolve: 'gatsby-plugin-react-svg',
      options: {
        rule: {
          include: /\.inline\.svg$/,
        },
      },
    },

    // postcss support
    `gatsby-plugin-postcss`,

    //  head (title, meta, etc) modification plugin
    `gatsby-plugin-react-helmet`,

    // image pre-processing
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/../images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,

    // PWA manifest generation (icon, theme, etc)
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#006bd9`,
        theme_color: `#006bd9`,
        display: `minimal-ui`,
        icon: `../images/dice-icon.png`, // This path is relative to the root of the site.
      },
    },
  ],
};
