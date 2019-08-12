import React, { useEffect, useState } from 'react';
import Item from './item';

const SideMenu = ({ targets }) => {
  const [currentUrl, setCurrentUrl] = useState(null);

  useEffect(() => {
    const options = {
      threshold: 0.5, // activate at 50% visibility
    };

    const observer = new IntersectionObserver(entries => {
      entries
        .filter(entry => entry.isIntersecting)
        .forEach(entry => {
          const target = targets.find(t => t.target.current === entry.target);
          if (!target) {
            return;
          }
          setCurrentUrl(target.url);
        });
    }, options);

    targets.forEach(({ target: { current } }) => observer.observe(current));

    return () => observer.disconnect();
  }, targets);

  return (
    <div
      className="column is-flex"
      style={{
        position: 'fixed',
        right: 0,
        top: 96,
        height: 'calc(100% - 96px)',
        justifyContent: 'center',
        alignItems: 'flex-end',
        flexDirection: 'column',
        maxWidth: 100,
        margin: '0.5em',
      }}
    >
      {targets.map(l => (
        <Item key={l.url} item={l} isCurrent={currentUrl === l.url} />
      ))}
    </div>
  );
};

export default SideMenu;
