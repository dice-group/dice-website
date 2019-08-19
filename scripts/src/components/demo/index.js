import { Link } from 'gatsby';
import React from 'react';
import Image from '../image';

const Demo = ({ node }) => (
  <div className="active-project project-card">
    <div className="project-image">
      <Image
        filename={node.data.logo || node.data.screenshot[0]}
        alt={`${node.data.name} logo`}
        style={{ width: 200 }}
      />
    </div>
    <h2 className="title">{node.data.name}</h2>
    <div className="separator" />
    <Link to={node.path} className="link">
      Learn more
    </Link>
  </div>
);

export default Demo;
