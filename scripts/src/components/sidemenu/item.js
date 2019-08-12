import React, { useState } from 'react';
import { FaCircle } from 'react-icons/fa';

const SideMenuItem = ({ item, isCurrent }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseOver = () => setShowTooltip(true);
  const handleMouseOut = () => setShowTooltip(false);
  const handleClick = e => {
    e.preventDefault();
    document.getElementById(item.url).scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="is-flex"
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <style jsx>{`
        .is-current {
          opacity: 1;
        }
        .is-not-current {
          opacity: 0.2;
        }
      `}</style>
      {showTooltip && (
        <span className="tag is-medium is-light">{item.title}</span>
      )}
      <a href={`#${item.url}`} title={item.title} onClick={handleClick}>
        <span
          className={`icon is-medium ${
            isCurrent ? 'is-current' : 'is-not-current'
          }`}
        >
          <FaCircle size={16} />
        </span>
      </a>
    </div>
  );
};

export default SideMenuItem;
