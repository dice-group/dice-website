const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const fetch = require('isomorphic-unfetch');
const {
  Writer,
  DataFactory: { namedNode, literal, quad },
} = require('n3');

// path to folder with papers
// uses ./data/papers from project root
const folder = path.join(__dirname, '..', '..', 'data', 'papers');

// common prefixes that we use
const prefixes = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dice: 'https://dice-research.org/',
  dicepapers: 'https://dice-research.org/papers/',
  schema: 'https://schema.dice-research.org/',
};

// writer config that outputs turtle with our prefixes
const writerConfig = {
  format: 'Turtle',
  prefixes,
};

/**
 * Creates new function with given writer and URL
 * that will add predicate and object as named node
 *
 * @param {Object} writer N3 writer instance
 * @param {any} paperUrl URL of the subject
 */
const createUrlWriter = (writer, paperUrl) => (predicate, obj) => {
  // only write triples with non-null objects
  if (!obj || !obj.length) {
    return;
  }
  writer.addQuad(
    quad(namedNode(paperUrl), namedNode(predicate), namedNode(obj.trim()))
  );
};

/**
 * Creates new function with given writer and URL
 * that will add predicate and object as literal
 *
 * @param {Object} writer N3 writer instance
 * @param {any} paperUrl URL of the subject
 */
const createLiteralWriter = (writer, paperUrl) => (predicate, obj) => {
  // only write triples with non-null objects
  if (!obj || !obj.length) {
    return;
  }
  writer.addQuad(
    quad(
      namedNode(paperUrl),
      namedNode(`${prefixes.schema}${predicate}`),
      literal(obj)
    )
  );
};

/**
 * Function for checking whether a given string is a valid URL. The regex is copied from
 * https://stackoverflow.com/questions/17726427/check-if-url-is-valid-or-not .
 */
function checkUrl(url) {
  var regexp = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?$/;
  return regexp.test(url);
}

/**
 * Main logic execution (because we still don't have top level async)
 */
const main = async () => {
  // get papers for tag `simba`
  const { items: papers } = await fetch(
    `https://www.bibsonomy.org/json/user/dice-research/simba?items=1000`
  ).then(r => r.json());

  // load papers with "dice" tag and add them to result dataset
  const papersDice = await fetch(
    `https://www.bibsonomy.org/json/user/dice-research/dice?items=1000`
  ).then(r => r.json());

  // merge papers into one array
  papersDice.items.forEach(paper => {
    // ignore papers that are already added
    if (papers.find(p => p.id === paper.id)) {
      return;
    }

    papers.push(paper);
  });

  console.log('Processing papers:', papers.length);

  // process papers one by one
  papers.forEach(paper => {
    // create new turtle writer for paper
    const writer = new Writer(writerConfig);

    // generate a basename for file and URL
    const baseName = _.upperFirst(_.camelCase(paper.label));
    const baseFileName = paper.id.replace(
      /https:\/\/www.bibsonomy.org\/bibtex\/(.+?)\/(.+)/,
      '$1_$2'
    );

    // generate URL for paper
    const paperUrl = `${prefixes.dicepapers}${baseName}`;

    // create writer functions
    const writeUrl = createUrlWriter(writer, paperUrl);
    const writeLiteral = createLiteralWriter(writer, paperUrl);

    // write rdf:type info
    writeUrl(`${prefixes.rdf}type`, `${prefixes.schema}Publication`);

    // write base info
    writeLiteral('type', paper.type);
    writeLiteral('title', paper.label);
    writeLiteral('publicationType', paper['pub-type']);
    writeLiteral('year', paper.year);
    if (paper.booktitle || paper.journal) {
      writeLiteral('source', paper.booktitle || paper.journal);
    }
    if (paper.tags && paper.tags.length > 0) {
      paper.tags.forEach(tag => {
        writeLiteral('tag', tag);
      });
    }
    // make sure that URL is valid before adding it
    if (checkUrl(paper.url)) {
      writeUrl(`${prefixes.schema}url`, paper.url);
    }
    writeUrl(`${prefixes.schema}bibsonomyId`, paper.id);
    // TODO: Throws error parsing '\\_' and '\\%'
    // See: https://github.com/dice-group/dice-website/issues/210
    // writeUrl(`${prefixes.schema}pdfUrl`, paper['bdsk-url-1'] || paper['1']);
    if (paper.authors && paper.authors.length > 0) {
      // write URLs that link to our website
      paper.authors.forEach(author => {
        const name = _.upperFirst(_.camelCase(author.first + author.last));
        writeUrl(`${prefixes.schema}author`, `${prefixes.dice}${name}`);
      });
      // write plaintext names
      paper.authors.forEach(({ first, last }) => {
        writeLiteral('authorName', `${first} ${last}`);
      });
    }

    // save paper to the file
    writer.end((error, result) => {
      if (error) {
        throw error;
      }
      // generate filename
      const filename = `${baseFileName}.ttl`;
      const filepath = path.join(folder, filename);
      // write result
      fs.writeFile(filepath, result, err => {
        if (err) {
          throw err;
        }
      });
    });
  });
};

main();
