import React from 'react';
import { Link } from 'gatsby';

export const Person = ({ person }) => (
  <div style={{ padding: 20 }} key={person.name}>
    Name: <Link to={person.path}>{person.name}</Link>
    <br />
    Email: {person.email}
    <br />
    Projects:{' '}
    {person.projects.map(p => (
      <Link style={{ paddingRight: 10 }} to={`/${p.path}`}>
        {p.name}
      </Link>
    ))}
  </div>
);

export const rdfToPeopleArray = edges =>
  edges
    .map(n => n.node)
    .map(({ data, path }) => ({
      name: data.foaf_name,
      email: data.foaf_mbox,
      path: path,
      projects: data.website_project.map(p => ({
        name: p.data.rdfs_label,
        path: p.path,
      })),
      role: {
        name: data.website_role.data.rdfs_label,
        priority: data.website_role.data.websiteSchema_priority,
      },
    }));
