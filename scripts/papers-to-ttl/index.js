const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const fetch = require('isomorphic-unfetch');
const {
  Writer,
  DataFactory: { namedNode, literal, quad },
} = require('n3');

const folder = path.join(__dirname, '..', '..', 'data', 'papers');

const prefixes = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dice: 'https://dice-research.org/',
  dicepapers: 'https://dice-research.org/papers/',
  schema: 'https://schema.dice-research.org/',
};

// writer config
const writerConfig = {
  format: 'Turtle',
  prefixes,
};

const createUrlWriter = (writer, paperUrl) => (predicate, obj) => {
  // only write triples with non-null objects
  if (!obj || !obj.length) {
    return;
  }
  writer.addQuad(
    quad(namedNode(paperUrl), namedNode(predicate), namedNode(obj.trim()))
  );
};

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

const main = async () => {
  // get papers for tag `simba`
  const { items: papers } = await fetch(
    `https://www.bibsonomy.org/json/user/dice-research/simba?items=1000`
  ).then(r => r.json());

  // load papers with "dice" tag and add them to result dataset
  const papersDice = await fetch(
    `https://www.bibsonomy.org/json/user/dice-research/dice?items=1000`
  ).then(r => r.json());
  papersDice.items.forEach(paper => {
    // ignore papers that are already added
    if (papers.find(p => p.id === paper.id)) {
      return;
    }

    papers.push(paper);
  });

  console.log('Processing papers:', papers.length);

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
    writeUrl(`${prefixes.schema}url`, paper.url);
    writeUrl(`${prefixes.schema}bibsonomyId`, paper.id);
    writeUrl(`${prefixes.schema}pdfUrl`, paper['bdsk-url-1'] || paper['1']);
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
