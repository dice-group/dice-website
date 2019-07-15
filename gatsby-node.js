const path = require(`path`);
const { createFilePath } = require('gatsby-source-filesystem');

const renderRdfType = async ({ template, type, createPage, graphql }) => {
  // Person RDF rendering
  const rdfResult = await graphql(`
    {
      allRdf(
        filter: {
          data: { rdf_type: { eq: "${type}" } }
        }
      ) {
        edges {
          node {
            path
          }
        }
      }
    }
  `);
  if (rdfResult.errors) {
    return Promise.reject(rdfResult.errors);
  }
  rdfResult.data.allRdf.edges.forEach(({ node }) => {
    createPage({
      path: node.path,
      component: template,
      context: {}, // additional data can be passed via context
    });
  });
};

exports.createPages = async ({ actions: { createPage }, graphql }) => {
  // mdx news rendering
  const mdxNewsTemplate = path.resolve(`src/templates/newsPage.js`);
  const mdxNewsResult = await graphql(`
    {
      allMdx(filter: { fields: { type: { eq: "news" } } }) {
        edges {
          node {
            fields {
              path
            }
          }
        }
      }
    }
  `);
  if (mdxNewsResult.errors) {
    return Promise.reject(mdxNewsResult.errors);
  }
  mdxNewsResult.data.allMdx.edges.forEach(({ node }) => {
    createPage({
      path: node.fields.path,
      component: mdxNewsTemplate,
      context: {}, // additional data can be passed via context
    });
  });

  // mdx rendering
  const mdxTemplate = path.resolve(`src/templates/markdownPage.js`);
  const mdxResult = await graphql(`
    {
      allMdx(filter: { fields: { type: { ne: "news" } } }) {
        edges {
          node {
            fields {
              path
            }
          }
        }
      }
    }
  `);
  if (mdxResult.errors) {
    return Promise.reject(mdxResult.errors);
  }
  mdxResult.data.allMdx.edges.forEach(({ node }) => {
    createPage({
      path: node.fields.path,
      component: mdxTemplate,
      context: {}, // additional data can be passed via context
    });
  });

  // Person RDF rendering
  const personTemplate = path.resolve(`src/templates/personPage.js`);
  const personType = 'https://schema.dice-research.org/Person';
  await renderRdfType({
    template: personTemplate,
    type: personType,
    createPage,
    graphql,
  });

  // Person RDF rendering
  const projectTemplate = path.resolve(`src/templates/projectPage.js`);
  const projectType = 'https://schema.dice-research.org/Project';
  await renderRdfType({
    template: projectTemplate,
    type: projectType,
    createPage,
    graphql,
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;
  // We only want to operate on `Mdx` nodes. If we had content from a
  // remote CMS we could also check to see if the parent node was a
  // `File` node here
  if (node.internal.type === 'Mdx') {
    // generate path from frontmatter or from node path
    const basePath = createFilePath({ node, getNode });
    const nodePath =
      node.internal.frontmatter && node.internal.frontmatter.path
        ? node.internal.frontmatter.path
        : basePath;
    createNodeField({
      name: 'path',
      node,
      value: nodePath,
    });

    // generate article type from frontmatter or from node path
    const baseType = basePath.split('/')[1] || 'page';
    const nodeType =
      node.internal.frontmatter && node.internal.frontmatter.type
        ? node.internal.frontmatter.type
        : baseType;
    createNodeField({
      name: 'type',
      node,
      value: nodeType,
    });
  }
};
