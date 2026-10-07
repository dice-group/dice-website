import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import n3 from 'n3';

const { Parser } = n3;
const input = path.resolve(
  process.argv[2] || fileURLToPath(new URL('../../data', import.meta.url))
);
const output = path.resolve(
  process.argv[3] ||
    fileURLToPath(new URL('../../data/rag/entities.json', import.meta.url))
);
const base = 'https://dice-research.org/';
const schema = 'https://schema.dice-research.org/';
const arrays = new Set([
  'content',
  'contenthtml',
  'project',
  'relatedProject',
  'relatedDemo',
  'partner',
  'funder',
  'author',
  'authorName',
  'awardee',
  'awardeeExternal',
  'tag',
  'member',
  'developer',
]);
const relations = new Set([
  'role',
  'project',
  'relatedProject',
  'relatedDemo',
  'partner',
  'funder',
  'author',
  'awardee',
  'member',
  'maintainer',
  'developer',
  'lead',
]);
const fields = new Set([
  'name',
  'tagline',
  'content',
  'contenthtml',
  'status',
  'startDate',
  'endDate',
  'publicationTag',
  'title',
  'publicationType',
  'source',
  'year',
  'authorName',
  'awardeeExternal',
  'tag',
  ...relations,
]);
const raw = Object.create(null);

function walk(dir) {
  for (const entry of fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (
      ['rag', 'papers_all'].includes(entry.name) ||
      /example/i.test(entry.name)
    )
      continue;
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(filename);
    } else if (entry.name.endsWith('.ttl')) {
      let quads;
      try {
        quads = new Parser().parse(fs.readFileSync(filename, 'utf8'));
      } catch (error) {
        throw new Error(`Cannot parse ${filename}: ${error.message}`);
      }
      for (const { subject, predicate, object } of quads) {
        if (subject.termType !== 'NamedNode') continue;
        const id = subject.value;
        const entity =
          raw[id] ||
          (raw[id] = {
            id,
            path: id.startsWith(base) ? `/${id.slice(base.length)}` : null,
            data: {},
            types: [],
          });
        if (
          predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
        ) {
          entity.types.push(object.value);
          continue;
        }
        if (!predicate.value.startsWith(schema)) continue;
        const field = predicate.value.slice(schema.length);
        if (!fields.has(field)) continue;
        if (arrays.has(field)) {
          const values = entity.data[field] || (entity.data[field] = []);
          if (!values.includes(object.value)) values.push(object.value);
        } else {
          entity.data[field] = object.value;
        }
      }
    }
  }
}
walk(input);

// Keep references bounded: context needs names and member/staff roles, not cycles.
function reference(id, includeRole = true) {
  const target = raw[id];
  const data = {};
  if (target?.data.name) data.name = target.data.name;
  if (target?.data.tagline) data.tagline = target.data.tagline;
  if (includeRole && target?.data.role)
    data.role = reference(target.data.role, false);
  return { id, path: target?.path || null, data };
}

const entities = Object.create(null);
for (const id of Object.keys(raw).sort()) {
  const entity = raw[id];
  const data = { ...entity.data };
  for (const field of relations) {
    if (!data[field]) continue;
    data[field] = Array.isArray(data[field])
      ? data[field].map(id => reference(id))
      : reference(data[field]);
  }
  entities[id] = { id, path: entity.path, data };
  if (
    entity.types.some(
      type =>
        type === `${schema}Project` ||
        raw[type]?.types.includes(`${schema}ProjectType`)
    )
  )
    entities[id].staff = [];
}
for (const entity of Object.values(raw)) {
  if (!entity.types.includes(`${schema}Person`)) continue;
  const role = raw[entity.data.role];
  if (
    String(entity.data.role || '')
      .toLowerCase()
      .endsWith('/alumni') ||
    role?.data.name?.toLowerCase() === 'alumni'
  )
    continue;
  for (const project of entity.data.project || []) {
    if (entities[project]?.staff)
      entities[project].staff.push(reference(entity.id));
  }
}
fs.mkdirSync(path.dirname(output), { recursive: true });
const temporary = `${output}.tmp`;
fs.writeFileSync(temporary, JSON.stringify(entities, null, 2) + '\n');
fs.renameSync(temporary, output);
console.log(`Wrote ${Object.keys(entities).length} entities to ${output}`);
