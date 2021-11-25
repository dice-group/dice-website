import React from 'react';
import Image from '../image';

const fundedBy = [
  {
    url: 'http://www.bmbf.de/',
    image: ['logo-bmbf.png'],
    text: ['BMBF'],
  },
  {
    url: 'http://www.bmwi.de/',
    image: ['logo-bmwi.png'],
    text: ['BMWI'],
  },
  {
    url: 'http://www.bmvi.de/',
    image: ['logo-bmVI.png'],
    text: ['BMVI'],
  },
  {
    url: 'http://www.eurostars.dlr.de/',
    image: ['logo-eurostars.png'],
    text: ['EuroStars'],
  },
  {
    url: 'http://cordis.europa.eu/',
    image: ['logo-fp7.png'],
    text: ['FP7'],
  },
  {
    url: 'http://www.daad.de/',
    image: ['logo-daad.png'],
    text: ['DAAD'],
  },
  {
    url: 'http://ec.europa.eu/',
    image: ['horizon2020.png'],
    text: ['Horizon2020'],
  },
  {
    url: 'http://www.dfg.de/',
    image: ['logo-dfg.png'],
    text: ['DFG'],
  },
];

const getProgram = fundingProgram => {
  const fundedPrograms = fundedBy.filter(fp =>
    // fundingProgram.toLowerCase().includes(fp.text.toLowerCase())
    fp.text.some(t => fundingProgram.toLowerCase().includes(t.toLowerCase()))
  );
  return fundedPrograms || null;
};

const FundedBy = ({ fundingProgram }) =>
  fundingProgram ? (
    <div>
      <span>{fundingProgram}</span>
      <div>
        {getProgram(fundingProgram).map(fp =>
          fp.image.map((image, index) => (
            <span
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
              key={fp.url + index}
            >
              <a href={fp.url}>
                <Image
                  filename={image}
                  style={{ width: 100 }}
                  key={image + index}
                />
              </a>
            </span>
          ))
        )}
      </div>
    </div>
  ) : (
    <div className="columns">
      {fundedBy.map(org => (
        <div key={org.url} className="column funded-by-item">
          <a href={org.url} target="_blank" rel="noopener noreferrer">
            <Image
              filename={org.image[0]}
              alt={org.text[0]}
              style={{ width: 100 }}
            />
          </a>
        </div>
      ))}
    </div>
  );

export default FundedBy;
