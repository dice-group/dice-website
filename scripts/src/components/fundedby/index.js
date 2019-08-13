import React from 'react';
import Image from '../image';

const fundedBy = [
  {
    url: 'http://www.bmbf.de/',
    image: 'logo-bmbf.png',
    text: 'BMBF',
  },
  {
    url: 'http://www.bmwi.de/',
    image: 'logo-bmwi.png',
    text: 'BMWI',
  },
  {
    url: 'http://www.bmvi.de/',
    image: 'logo-bmVI.png',
    text: 'BMVI',
  },
  {
    url: 'http://www.eurostars.dlr.de/',
    image: 'logo-eurostars.png',
    text: 'EuroStars',
  },
  {
    url: 'http://cordis.europa.eu/',
    image: 'logo-fp7.png',
    text: 'FP7',
  },
  {
    url: 'http://www.daad.de/',
    image: 'logo-daad.png',
    text: 'DAAD',
  },
  {
    url: 'http://ec.europa.eu/',
    image: 'horizon2020.png',
    text: 'Horizon2020',
  },
  {
    url: 'http://www.dfg.de/',
    image: 'logo-dfg.png',
    text: 'DFG',
  },
];

const FundedBy = () => (
  <div className="columns is-multiline">
    {fundedBy.map(org => (
      <div key={org.url} className="column is-3 funded-by-item">
        <a href={org.url}>
          <Image filename={org.image} alt={org.text} style={{ width: 100 }} />
        </a>
      </div>
    ))}
  </div>
);

export default FundedBy;
