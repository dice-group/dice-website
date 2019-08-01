import { Link } from 'gatsby';
import React from 'react';
import Image from '../image';

const Project = ({ project, renderType = true }) => (
  <div key={project.path} className="card" style={{ margin: '1em' }}>
    <div className="card-content">
      <div className="media">
        <div className="media-left">
          <figure className="image gatsby-image is-64x64">
            <Image
              filename={project.data.logo}
              alt={`${project.data.name} logo`}
            />
          </figure>
        </div>
        <div className="media-content">
          <p className="title is-4">
            <Link to={project.path}>{project.data.name}</Link>
          </p>
          {renderType && (
            <p className="subtitle is-6">
              {project.data.rdf_type[0].data.name}
            </p>
          )}
        </div>
      </div>

      <div className="content">{project.data.tagline}</div>
    </div>
  </div>
);

export default Project;
