import { Link } from 'gatsby';
import React from 'react';
import Image from '../image';

const Demo = ({ node }) => (
  <div className="card" style={{ margin: '1em' }}>
    <div className="card-content">
      <div className="media">
        <div className="media-left">
          <figure className="image is-64x64">
            <Image
              filename={node.data.screenshot[0]}
              alt={`${node.data.name} screenshot`}
            />
          </figure>
        </div>
        <div className="media-content">
          <p className="title is-4">
            <Link to={node.path}>{node.data.name}</Link>
          </p>
          <p className="subtitle is-6">
            Maintainer:{' '}
            <Link to={node.data.maintainer.path}>
              {node.data.maintainer.data.name}
            </Link>
          </p>
        </div>
      </div>

      <div className="content">{node.data.description}</div>
    </div>
  </div>
);

export default Demo;
