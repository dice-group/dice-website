const { Parser } = require('n3');

const basePath = 'https://dice-research.org/';

const arrayPredicates = [
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  'https://schema.dice-research.org/content',
  'https://schema.dice-research.org/project',
  'https://schema.dice-research.org/relatedProject',
  'https://schema.dice-research.org/partner',
  'https://schema.dice-research.org/author',
  'https://schema.dice-research.org/authorName',
  'https://schema.dice-research.org/awardee',
  'https://schema.dice-research.org/tag',
];

const relationPredicates = [
  'rdf:type',
  'schema:relatedProject',
  'schema:maintainer',
  'schema:partner',
  'schema:role',
  'schema:project',
  'schema:author',
  'schema:awardee',
];

const defaultPrefixes = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
};

const processResult = ({ result, resultSubject, prefixes: filePrefixes }) => {
  const prefixes = { ...defaultPrefixes, ...filePrefixes };
  const urls = Object.keys(prefixes).map(p => ({
    url: prefixes[p],
    prefix: p,
  }));

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

  // remove rdf:type link to schema:BaseClass. this is required to convert RDF to GraphQL
  // if we'd leave schema:BaseClass in - gatsby would try to resolve it and fail
  // which in turn would lead to build errors
  if (data['rdf:type'][0] === 'schema:BaseClass') {
    console.log('removing rdf:type from', resultSubject);
    delete data['rdf:type'];
  }

  // link to other resources
  Object.keys(data).forEach(key => {
    if (relationPredicates.includes(key)) {
      // get value
      const val = data[key];
      // remove basic value key
      delete data[key];
      // add link to other node
      data[`${key}___NODE`] = val;
    }
  });

  // replace schema: prefix with empty string for nicer queries
  Object.keys(data).forEach(key => {
    if (key.startsWith('schema:')) {
      // get value
      const val = data[key];
      const newKey = key.replace('schema:', '');
      // remove basic value key
      delete data[key];
      // add link to other node
      data[newKey] = val;
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
      console.error(`Error parsing ${node.relativePath}!`, error);
      throw error;
    }
    if (!quad && prefixes) {
      const resultObject = processResult({ result, resultSubject, prefixes });
      transformObject(resultObject, resultSubject, 'RDF');
      return;
    }
    const {
      subject: { id: subject },
      predicate: { id: predicate },
      object,
    } = quad;

    if (!resultSubject) {
      resultSubject = subject;
    }

    let value;
    try {
      value = String(JSON.parse(object.value));
    } catch {
      value = object.value;
    }

    const hasArrayOfValues = arrayPredicates.includes(predicate);
    if (!hasArrayOfValues) {
      result[predicate] = value;
    } else {
      const old = result[predicate];
      result[predicate] = [].concat(old, value).filter(Boolean);
    }
  });
}

exports.onCreateNode = onCreateNode;
