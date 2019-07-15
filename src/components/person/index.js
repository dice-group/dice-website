import { Link } from 'gatsby';
import React from 'react';

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
      name: data.name,
      email: data.email,
      path: path,
      projects: data.project.map(p => ({
        name: p.data.name,
        path: p.path,
      })),
      role: {
        name: data.role.data.name,
        priority: data.role.data.priority,
      },
    }));
