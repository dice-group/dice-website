import React from 'react';

const fundedBy = [
  {
    url: 'http://www.bmbf.de/',
    image: 'https://dice-research.org/fileadmin/Front_Logos/logo-bmbf.png',
    text: 'BMBF',
  },
  {
    url: 'http://www.bmwi.de/',
    image: 'https://dice-research.org/fileadmin/Front_Logos/logo-bmwi.png',
    text: 'BMWI',
  },
  {
    url: 'http://www.bmvi.de/',
    image: 'https://dice-research.org/fileadmin/Front_Logos/logo-bmVI.png',
    text: 'BMVI',
  },
  {
    url: 'http://www.eurostars.dlr.de/',
    image: 'https://dice-research.org/fileadmin/Front_Logos/logo-eurostars.png',
    text: 'EuroStars',
  },
  {
    url: 'http://cordis.europa.eu/',
    image: 'https://dice-research.org/fileadmin/Front_Logos/logo-fp7.png',
    text: 'FP7',
  },
  {
    url: 'http://www.daad.de/',
    image: 'https://dice-research.org/fileadmin/Front_Logos/logo-daad.png',
    text: 'DAAD',
  },
  {
    url: 'http://ec.europa.eu/',
    image:
      'https://dice-research.org/fileadmin/Front_Logos/logo-horizon2020.png',
    text: 'Horizon2020',
  },
  {
    url: 'http://ec.europa.eu/',
    image: 'https://dice-research.org/fileadmin/Front_Logos/horizon2020.png',
    text: 'Horizon2020',
  },
  {
    url: 'http://www.dfg.de/',
    image: 'https://dice-research.org/fileadmin/Front_Logos/logo-dfg.png',
    text: 'DFG',
  },
];

const FundedBy = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    {fundedBy.map(org => (
      <a href={org.url}>
        <img src={org.image} alt={org.text} />
      </a>
    ))}
  </div>
);

export default FundedBy;
