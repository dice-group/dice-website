import { Link } from 'gatsby';
import React from 'react';
import ExternalLink from '../externalLink';

const Award = ({ node: { id, data } }) => (
  <div key={id} className="award">
    <p className="year">{data.year}</p>
    <h4 className="name">
      {data.url ? (
        <ExternalLink to={data.url}>{data.name}</ExternalLink>
      ) : (
        data.name
      )}
    </h4>
    <p className="description">{data.content}</p>
    {(data.awardee || data.awardeeExternal) && (
      <p>
        Awarded to:{' '}
        {data.awardee
          .map(person => (
            <Link key={person.path} className="awardee" to={person.path}>
              {person.data.name}
            </Link>
          ))
          .concat(
            data.awardeeExternal
              ? data.awardeeExternal.map(p => (
                  <span key={p} className="awardee">
                    {p}
                  </span>
                ))
              : []
          )
          .map((element, index, array) => (
            <React.Fragment key={index}>
              {element}
              {index + 1 !== array.length && ', '}
            </React.Fragment>
          ))}
      </p>
    )}
  </div>
);

export default Award;
