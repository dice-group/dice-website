import React, { useRef } from 'react';
import Image from '../image';

const Partner = ({ partner, renderType = true }) => {
  const url = useRef();
  return (
    <div className="partner" onClick={() => url.current && url.current.click()}>
      <div className="project-image">
        <Image
          filename={partner.data.logo}
          alt={`${partner.data.name} logo`}
          style={{ width: 200 }}
        />
      </div>
      <a
        className="name"
        href={partner.data.url}
        target="_blank"
        rel="noopener noreferrer"
        ref={url}
      >
        {partner.data.name}
      </a>
    </div>
  );
};

export default Partner;
