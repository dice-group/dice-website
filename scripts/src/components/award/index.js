import { Link } from 'gatsby';
import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';

const Award = ({ node: { id, data } }) => (
  <div
    key={id}
    className="award tile is-vertical"
    style={{ marginBottom: '2em' }}
  >
    <p className="year">{data.year}</p>
    <h5 className="name title is-4">
      {data.url ? (
        <a href={data.url}>
          {data.name} <FaExternalLinkAlt className="ext-icon" />
        </a>
      ) : (
        data.name
      )}
    </h5>
    <p className="description">{data.content}</p>
    {(data.awardee || data.awardeeExternal) && (
      <p>
        Awarded to:{' '}
        {data.awardee.map(person => (
          <Link key={person.path} className="awardee" to={person.path}>
            {person.data.name}
          </Link>
        ))}
        {data.awardeeExternal &&
          data.awardeeExternal.map(p => (
            <span key={p} className="awardee">
              {p}
            </span>
          ))}
      </p>
    )}
  </div>
);

export default Award;
