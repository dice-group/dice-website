import { Link } from 'gatsby';
import React from 'react';
import Image from '../image';

export const Person = ({ person }) => (
  <div key={person.path} className="card" style={{ margin: '1em' }}>
    <div className="card-content">
      <div className="media">
        <div className="media-left">
          <figure className="image is-64x64">
            <Image
              filename={person.photo}
              alt={`${person.name} photo`}
              placeholderClassName="is-rounded"
              className="is-rounded"
            />
          </figure>
        </div>
        <div className="media-content">
          <p className="title is-4">
            <Link to={person.path}>
              {person.namePrefix} {person.name}
            </Link>
          </p>
          <p className="subtitle is-6">
            <a href={person.email}>{person.email.replace('mailto:', '')}</a>
          </p>
        </div>
      </div>

      <div className="content" />
    </div>
  </div>
);

export const rdfToPeopleArray = edges =>
  edges
    .map(n => n.node)
    .map(({ data, path }) => ({
      ...data,
      path: path,
      projects: data.project.map(p => ({
        name: p.data.name,
        path: p.path,
      })),
      role: data.role.data,
    }));
