import React from 'react';
import Image from '../image';

const Partner = ({ partner, renderType = true }) => (
  <div
    className="partner"
    onClick={() => {
      window.location.href = partner.data.url;
    }}
  >
    <div className="project-image">
      <Image
        filename={partner.data.logo}
        alt={`${partner.data.name} logo`}
        style={{ width: 200 }}
      />
    </div>
    <a className="name" href={partner.data.url}>
      {partner.data.name}
    </a>
  </div>
);

export default Partner;
