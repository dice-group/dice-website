import React from 'react';
import { TwitterTimelineEmbed } from 'react-twitter-embed';

const injectTwitterStyle = () => {
  // get timeline by ID
  const timeline = document.getElementById('twitter-widget-0');
  // set height to auto
  timeline.style.height = 'auto';
  // create new style element
  const style = document.createElement('style');
  style.innerHTML = `
  @media screen and (min-width: 1024px) {
    .timeline-TweetList {
      display: flex;
    }

    .timeline-TweetList-tweet {
      min-width: 300px;
      flex: 1;
    }
  }

  @media screen and (max-width: 640px) {
    .timeline-TweetList {
      display: inherit;
    }
  }

  .timeline-Tweet-text {
    font-size: 1.25em !important;
    line-height: inherit !important;
    margin-bottom: 0;
  }
  `;
  // add style to iframe
  timeline.contentWindow.document.head.appendChild(style);
};

export default () => (
  <TwitterTimelineEmbed
    sourceType="profile"
    screenName="DiceResearch"
    noFooter
    noHeader
    noScrollbar
    autoHeight
    options={{ tweetLimit: 3, dnt: true }}
    onLoad={injectTwitterStyle}
  />
);
