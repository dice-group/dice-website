import React from 'react';
import { FaFacebookF, FaGithub, FaTwitter, FaYoutube } from 'react-icons/fa';

const links = [
  {
    url: 'https://www.facebook.com/DiceUPB',
    text: 'Facebook',
    icon: FaFacebookF,
  },
  { url: 'https://twitter.com/DiceResearch', text: 'Twitter', icon: FaTwitter },
  { url: 'https://github.com/dice-group', text: 'GitHub', icon: FaGithub },
  {
    url: 'https://www.youtube.com/channel/UCDshdIaiXqwZsQ4Gl_70OMA',
    text: 'YouTube',
    icon: FaYoutube,
  },
];

const Social = ({ style }) => (
  <div
    className="column is-flex"
    style={{
      justifyContent: 'space-evenly',
      alignItems: 'center',
      minWidth: 150,
      ...style,
    }}
  >
    {links.map(l => (
      <a key={l.url} href={l.url} title={l.text}>
        <span class="icon">
          <l.icon />
        </span>
      </a>
    ))}
  </div>
);

export default Social;
