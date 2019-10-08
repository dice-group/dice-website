/* global IntersectionObserver */
import React, { useEffect, useState } from 'react';
import Item from './item';

const SideMenu = ({ targets }) => {
  const [currentUrl, setCurrentUrl] = useState(null);

  useEffect(() => {
    const observers = targets.map(({ target: { current } }) => {
      const observer = new IntersectionObserver(
        entries => {
          const entry = entries.filter(entry => entry.isIntersecting).pop();
          if (!entry) {
            return;
          }
          const target = targets.find(t => t.target.current === entry.target);
          if (!target) {
            return;
          }
          setCurrentUrl(target.url);
        },
        {
          threshold: 0.25,
          rootMargin: '0px',
        }
      );
      observer.observe(current);

      return observer;
    });

    return () => observers.forEach(observer => observer.disconnect());
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
