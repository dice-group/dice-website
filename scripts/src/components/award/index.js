import { Link } from 'gatsby';
import React from 'react';

const Award = ({ node: { id, data } }) => (
  <div key={id} className="tile is-vertical" style={{ marginBottom: '2em' }}>
    <h5 className="title is-4">
      <a href={data.url}>{data.name}</a>
      <span className="tag" style={{ marginLeft: 10 }}>
        {data.year}
      </span>
    </h5>
    <p className="subtitle">{data.content}</p>
    <div className="tile">
      <div style={{ marginRight: 10 }}>Awarded to:</div>
      <ul className="people-list">
        {data.awardee.map(person => (
          <li key={person.path}>
            <Link to={person.path}>{person.data.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default Award;
