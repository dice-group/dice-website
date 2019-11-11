import React from 'react';

const Table = ({ data }) => {
  return (
    <div className="key-val">
      {data.map(row => (
        <div key={row.key} className="key-row">
          <div className="key">{row.key}</div>
          <div className="val">{row.value}</div>
        </div>
      ))}
    </div>
  );
};

export default Table;
