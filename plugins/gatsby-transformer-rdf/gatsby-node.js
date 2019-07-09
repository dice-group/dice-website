const _ = require(`lodash`)
const { Parser } = require("n3")

async function onCreateNode({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  createContentDigest,
}) {
  // only log for nodes of mediaType `text/turtle`
  if (node.internal.mediaType !== `text/turtle`) {
    return
  }

  const transformObject = (obj, id, type) => {
    const rdfNode = {
      ...obj,
      id,
      children: [],
      parent: node.id,
      internal: {
        contentDigest: createContentDigest(obj),
        type,
      },
    }
    actions.createNode(rdfNode)
    actions.createParentChildLink({ parent: node, child: rdfNode })
  }

  const content = await loadNodeContent(node)

  const result = {}
  let resultSubject

  const parser = new Parser()
  parser.parse(content, (error, quad, prefixes) => {
    if (error) {
      return
    }
    if (!quad && prefixes) {
      const urls = Object.keys(prefixes).map(p => ({
        url: prefixes[p],
        prefix: p,
      }))

      const data = Object.keys(result)
        .map(predicate => {
          const matchingPrefix = urls.find(({ url }) => predicate.includes(url))
          if (matchingPrefix) {
            const fixedPrefix = predicate.replace(
              matchingPrefix.url,
              `${matchingPrefix.prefix}:`
            )
            return { [fixedPrefix]: result[predicate] }
          }

          return { predicate: result[predicate] }
        })
        .reduce((acc, val) => ({ ...acc, ...val }), {})

      const resultObject = {
        data,
        prefixes,
        subject: resultSubject,
      }
      transformObject(resultObject, resultSubject, "RDF")
      return
    }
    const {
      subject: { id: subject },
      predicate: { id: predicate },
      object: { id: object },
    } = quad

    if (!resultSubject) {
      resultSubject = subject
    }

    let value
    try {
      value = JSON.parse(object)
    } catch {
      value = object
    }

    result[predicate] = value
  })
}

exports.onCreateNode = onCreateNode
