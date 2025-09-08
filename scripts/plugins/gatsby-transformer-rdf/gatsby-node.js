const { Parser, Writer } = require('n3');
const jsonld = require('jsonld');

// base path for the URLs
const basePath = 'https://dice-research.org/';

// list of predicates that can have multiple values
const arrayPredicates = [
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  'https://schema.dice-research.org/text',
  'https://schema.dice-research.org/image',
  'https://schema.dice-research.org/funder',
  'https://schema.dice-research.org/content',
  'https://schema.dice-research.org/contenthtml',
  'https://schema.dice-research.org/project',
  'https://schema.dice-research.org/relatedProject',
  'https://schema.dice-research.org/relatedDemo',
  'https://schema.dice-research.org/partner',
  'https://schema.dice-research.org/author',
  'https://schema.dice-research.org/authorName',
  'https://schema.dice-research.org/awardee',
  'https://schema.dice-research.org/awardeeExternal',
  'https://schema.dice-research.org/tag',
  'https://schema.dice-research.org/developer',
  'https://schema.dice-research.org/screenshot',
  'https://schema.dice-research.org/member',
];

// list of predicates that define relations between entities
const relationPredicates = [
  'rdf:type',
  'schema:relatedProject',
  'schema:relatedDemo',
  'schema:maintainer',
  'schema:developer',
  'schema:partner',
  'schema:role',
  'schema:project',
  'schema:author',
  'schema:awardee',
  'schema:member',
  'schema:lead',
  'schema:funder',
];

// default predicates mapping
const defaultPrefixes = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
};

/**
 * Processes RDF result and returns Gatsby data node for writing
 *
 * @param {Object} { result, resultSubject, prefixes }
 * @returns {Object} Gatsby data node
 */
const processResult = ({
  result,
  resultSubject,
  prefixes: filePrefixes,
  jsonldData,
}) => {
  // merge default prefixes with those from the file
  const prefixes = { ...defaultPrefixes, ...filePrefixes };
  // map prefixes into array of {url, prefix} objects
  const urls = Object.keys(prefixes).map(p => ({
    url: prefixes[p],
    prefix: p,
  }));

  // map prefix URLs to short names
  const data = Object.keys(result)
    .map(predicate => {
      // try to find matching prefix
      const matchingPrefix = urls.find(({ url }) => predicate.includes(url));
      // if found - replace with short one
      if (matchingPrefix) {
        const fixedPrefix = predicate.replace(
          matchingPrefix.url,
          `${matchingPrefix.prefix}:`
        );
        return { [fixedPrefix]: result[predicate] };
      }

      // if not - leave as-is
      return { predicate: result[predicate] };
    })
    // reduce into original {predicate: value} object
    .reduce((acc, val) => ({ ...acc, ...val }), {});

  // remove rdf:type link to schema:BaseClass. this is required to convert RDF to GraphQL
  // if we'd leave schema:BaseClass in - gatsby would try to resolve it and fail
  // which in turn would lead to build errors
  if (data['rdf:type'][0] === 'schema:BaseClass') {
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

  // append JSON-LD as string
  data.jsonld = JSON.stringify(jsonldData);

  const resultObject = {
    data,
    prefixes,
    subject: resultSubject,
    path: `/${resultSubject.replace(basePath, '')}`,
  };

  return resultObject;
};

/**
 * Gatsby node creation handler
 */
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

  // create transform function that generates
  // new nodes in gatsby node format
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

  // load full file content
  const content = await loadNodeContent(node);

  // init result data
  const result = {};
  let resultSubject;

  // create new N3 parser
  const parser = new Parser();
  // create writer to convert content to JSON-LD
  const writer = new Writer({ format: 'application/n-quads' });
  const getWriterContent = () =>
    new Promise((resolve, reject) => {
      writer.end((err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  // parse content loaded from file
  parser.parse(content, async (error, quad, prefixes) => {
    // if we errored out show message in console
    // and re-throw error to interrupt build
    if (error) {
      console.error(`Error parsing ${node.relativePath}!`, error);
      throw error;
    }
    // if there's no quads, but prefixes do exist - we're done
    // start processing the result
    if (!quad && prefixes) {
      const nquads = await getWriterContent();
      const jld = await jsonld.fromRDF(nquads, {
        format: 'application/n-quads',
      });

      // process the results
      const resultObject = processResult({
        result,
        resultSubject,
        prefixes,
        jsonldData: jld,
      });
      // write to gatsby
      transformObject(resultObject, resultSubject, 'RDF');
      return;
    }

    // write quad to writer
    writer.addQuad(quad);

    // split quad into subject, predicate, object
    const {
      subject: { id: subject },
      predicate: { id: predicate },
      object,
    } = quad;

    // of we don't have resultSubject yet
    // set it to current subject
    if (!resultSubject) {
      resultSubject = subject;
    }

    // try to parse value
    // if we can - we should get a parsed JSON
    // if not - we just use value as-is
    let value;
    try {
      value = String(JSON.parse(object.value));
    } catch {
      value = object.value;
    }

    // if predicate is in the array of predicates
    // we're going to store value as array
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
