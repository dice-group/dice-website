const _ = require(`lodash`);
const { Parser } = require('n3');

const processResult = ({ result, resultSubject, prefixes }) => {
  const urls = Object.keys(prefixes).map(p => ({
    url: prefixes[p],
    prefix: p,
  }));
  const basePath = urls.find(({ prefix }) => prefix === 'website').url;

  // map prefix URLs to short names
  const data = Object.keys(result)
    .map(predicate => {
      const matchingPrefix = urls.find(({ url }) => predicate.includes(url));
      if (matchingPrefix) {
        const fixedPrefix = predicate.replace(
          matchingPrefix.url,
          `${matchingPrefix.prefix}:`
        );
        return { [fixedPrefix]: result[predicate] };
      }

      return { predicate: result[predicate] };
    })
    .reduce((acc, val) => ({ ...acc, ...val }), {});

  // link to other resources
  Object.keys(data).forEach(key => {
    if (key.startsWith('website:')) {
      // get value
      const val = data[key];
      // remove basic value key
      delete data[key];
      // add link to other node
      data[`${key}___NODE`] = val;
    }
  });

  const resultObject = {
    data,
    prefixes,
    subject: resultSubject,
    path: `/${resultSubject.replace(basePath, '')}`,
  };

  return resultObject;
};

async function onCreateNode({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  createContentDigest,
}) {
  // only log for nodes of mediaType `text/turtle`
  if (node.internal.mediaType !== `text/turtle`) {
    return;
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
    };
    actions.createNode(rdfNode);
    actions.createParentChildLink({ parent: node, child: rdfNode });
  };

  const content = await loadNodeContent(node);

  const result = {};
  let resultSubject;

  const parser = new Parser();
  parser.parse(content, (error, quad, prefixes) => {
    if (error) {
      return;
    }
    if (!quad && prefixes) {
      const resultObject = processResult({ result, resultSubject, prefixes });
      transformObject(resultObject, resultSubject, 'RDF');
      return;
    }
    const {
      subject: { id: subject },
      predicate: { id: predicate },
      object: { id: object },
    } = quad;

    if (!resultSubject) {
      resultSubject = subject;
    }

    let value;
    try {
      value = JSON.parse(object);
    } catch {
      value = object;
    }

    result[predicate] = value;
  });
}

exports.onCreateNode = onCreateNode;
