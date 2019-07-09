const path = require(`path`)

exports.createPages = async ({ actions: { createPage }, graphql }) => {
  const markdownTemplate = path.resolve(`src/templates/markdownPage.js`)
  const mdResult = await graphql(`
    {
      allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date] }
        limit: 1000
      ) {
        edges {
          node {
            frontmatter {
              path
            }
          }
        }
      }
    }
  `)
  if (mdResult.errors) {
    return Promise.reject(mdResult.errors)
  }
  mdResult.data.allMarkdownRemark.edges.forEach(({ node }) => {
    createPage({
      path: node.frontmatter.path,
      component: markdownTemplate,
      context: {}, // additional data can be passed via context
    })
  })

  const personTemplate = path.resolve(`src/templates/personPage.js`)
  const rdfResult = await graphql(`
    {
      allRdf(
        limit: 1000
        filter: {
          data: { rdf_type: { eq: "http://xmlns.com/foaf/0.1/Person" } }
        }
      ) {
        edges {
          node {
            path
          }
        }
      }
    }
  `)
  if (rdfResult.errors) {
    return Promise.reject(rdfResult.errors)
  }
  rdfResult.data.allRdf.edges.forEach(({ node }) => {
    createPage({
      path: node.path,
      component: personTemplate,
      context: {}, // additional data can be passed via context
    })
  })
}
