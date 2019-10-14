import { Link } from 'gatsby';
import React from 'react';

const links = [
  {
    url: '/collaborators/activeprojects/',
    title: 'Active projects',
  },
  {
    url: '/collaborators/demos/',
    title: 'Demos',
  },
  {
    url: '/collaborators/partners/',
    title: 'Partners',
  },
  {
    url: '/collaborators/groups/',
    title: 'Groups',
  },
];

export default function CollaboratorsNav({ activeLink }) {
  return (
    <div className="tabs">
      <ul className="container">
        {links.map(({ url, title }) => (
          <li key={url} className={activeLink === url ? 'is-active' : ''}>
            {activeLink === url ? (
              <a>{title}</a>
            ) : (
              <Link to={url}>{title}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
