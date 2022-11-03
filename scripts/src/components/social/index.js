import React from 'react';
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaYoutube,
  FaDatabase,
} from 'react-icons/fa';

const links = [
  { url: 'https://twitter.com/DiceResearch', text: 'Twitter', icon: FaTwitter },
  { url: 'https://github.com/dice-group', text: 'GitHub', icon: FaGithub },
  {
    url: 'https://www.youtube.com/@dice-research',
    text: 'YouTube',
    icon: FaYoutube,
  },
  {
    url: 'https://www.linkedin.com/company/dice-research/',
    text: 'LinkedIn',
    icon: FaLinkedin,
  },
  {
    url: 'https://ckan.dice-research.org/',
    text: 'Datasets',
    icon: FaDatabase,
  },
];

const Social = ({ style, className, hiddenMobile = true }) => (
  <div
    className={`column is-flex social ${
      hiddenMobile ? 'is-hidden-mobile is-hidden-tablet-only' : ''
    }`}
    style={{
      position: 'fixed',
      left: 0,
      top: 96,
      height: 'calc(60% - 96px)',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      maxWidth: 50,
      margin: '0.5em',
      ...style,
    }}
  >
    {links.map(l => (
      <a key={l.url} href={l.url} title={l.text}>
        <span className="icon is-large">
          <l.icon size={25} />
        </span>
      </a>
    ))}
  </div>
);

export default Social;
