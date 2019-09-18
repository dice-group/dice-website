import React from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const Dropdown = ({ onClick, title, isExpanded, facets, hasSearch }) => {
  return (
    <>
      <a onClick={onClick}>
        {title}{' '}
        {isExpanded ? (
          <FaChevronUp className="icon" />
        ) : (
          <FaChevronDown className="icon" />
        )}
      </a>
      {isExpanded && <div className="filter-dropdown">{facets}</div>}
    </>
  );
};

export default Dropdown;
