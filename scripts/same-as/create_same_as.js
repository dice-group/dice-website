const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const PEOPLE_DIR = '../../data/people';
const CSV_FILE = './DICE_ORCID_SCHOLAR.csv';

function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function clean(value) {
  if (!value) return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function findPersonFile(name) {
  const normalizedCsvName = normalizeName(name);

  const files = fs
    .readdirSync(PEOPLE_DIR)
    .filter(file => file.endsWith('.ttl'));

  for (const file of files) {
    const filePath = path.join(PEOPLE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const regex = /([^\s]+)\s+a\s+schema:Person\s*;[\s\S]*?schema:name\s+"([^"]+)"/g;

    let match;

    while ((match = regex.exec(content)) !== null) {
      const subject = match[1];
      const ttlName = match[2];

      if (normalizeName(ttlName) === normalizedCsvName) {
        return {
          filePath,
          content,
          subject,
        };
      }
    }
  }

  return null;
}

function ensureOwlPrefix(content) {
  if (content.includes('@prefix owl:')) {
    return content;
  }

  return '@prefix owl: <http://www.w3.org/2002/07/owl#> .\n' + content;
}

function addSameAs(content, subject, urls) {
  const newUrls = urls.filter(url => !content.includes(`<${url}>`));

  if (newUrls.length === 0) {
    return {
      content,
      changed: false,
    };
  }

  content = ensureOwlPrefix(content);

  const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const personStartRegex = new RegExp(
    `(${escapedSubject}\\s+a\\s+schema:Person\\s*;)`
  );

  const match = content.match(personStartRegex);

  if (!match) {
    console.warn(`Could not find schema:Person for ${subject}`);

    return {
      content,
      changed: false,
    };
  }

  const sameAsBlock =
    '\n    owl:sameAs\n' +
    newUrls.map(url => `        <${url}>`).join(',\n') +
    ' ;';

  const updatedContent = content.replace(personStartRegex, `$1${sameAsBlock}`);

  return {
    content: updatedContent,
    changed: true,
  };
}

const csv = fs.readFileSync(CSV_FILE, 'utf8');

const rows = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

for (const row of rows) {
  const name = clean(row['Name']);

  if (!name) {
    continue;
  }

  const person = findPersonFile(name);

  if (!person) {
    console.warn(`Person not found: ${name}`);
    continue;
  }

  const urls = [
    clean(row['ORCID Profile']),
    clean(row['Google Scholar Profile']),
    clean(row['dblp']),
  ].filter(Boolean);

  if (urls.length === 0) {
    console.log(`No sameAs URLs: ${name}`);
    continue;
  }

  const result = addSameAs(person.content, person.subject, urls);

  if (!result.changed) {
    console.log(`Already up to date: ${name}`);
    continue;
  }

  fs.writeFileSync(person.filePath, result.content, 'utf8');

  console.log(`Updated: ${name}`);
}
