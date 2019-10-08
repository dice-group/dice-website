/* global IntersectionObserver */
import React, { useEffect, useState } from 'react';
import Item from './item';

const SideMenu = ({ targets }) => {
  const [currentUrl, setCurrentUrl] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const intEntries = entries.filter(
          entry => entry.isIntersecting && entry.intersectionRatio === 1
        );
        if (!intEntries.length) {
          return;
        }
        const entry = intEntries.pop();
        const target = targets.find(t => t.target.current === entry.target);
        if (!target) {
          return;
        }
        setCurrentUrl(target.url);
      },
      {
        threshold: 1,
        rootMargin: '0px',
      }
    );

    targets.forEach(({ target: { current } }) => observer.observe(current));

    return () => observer.disconnect();
  }, targets);

  return (
    <div
      className="column is-flex is-hidden-mobile is-hidden-tablet-only"
      style={{
        position: 'fixed',
        right: 0,
        top: 96,
        height: 'calc(60% - 96px)',
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
