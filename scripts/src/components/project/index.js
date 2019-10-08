import { Link } from 'gatsby';
import React from 'react';
import Image from '../image';

const Project = ({ project, renderType = true }) => (
  <Link to={project.path}>
    <div className="active-project project-card">
      <div className="project-image">
        <Image
          filename={project.data.logo}
          alt={`${project.data.name} logo`}
          style={{ width: 200 }}
        />
      </div>
      <h2 className="title">{project.data.name}</h2>
      <div className="separator" />
      <span className="link">Learn more</span>
    </div>
  </Link>
);

export default Project;
