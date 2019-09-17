import { Link } from 'gatsby';
import React from 'react';
import Image from '../image';

export const Person = ({ person }) => (
  <div className="person" style={{ margin: '1em' }}>
    <div className="person-image">
      <Image
        filename={person.photo}
        alt={`${person.name} photo`}
        style={{ width: 160 }}
      />
    </div>
    <Link to={person.path}>
      {person.namePrefix} {person.name}
    </Link>
  </div>
);

export const rdfToPerson = ({ data, path }) => ({
  ...data,
  path: path,
  projects: data.projects
    ? data.project.map(p => ({
        name: p.data.name,
        path: p.path,
      }))
    : [],
  role: data.role ? data.role.data : {},
});

export const rdfToPeopleArray = edges =>
  edges.map(n => n.node).map(rdfToPerson);
