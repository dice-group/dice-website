const React = require('react');

exports.onRenderBody = ({ setHtmlAttributes, setPreBodyComponents }) => {
  setHtmlAttributes({ className: 'no-js' });
  setPreBodyComponents([
    React.createElement('script', {
      key: 'js-flag',
      dangerouslySetInnerHTML: {
        __html:
          'document.documentElement.className=' +
          'document.documentElement.className.replace(/\\bno-js\\b/, "js");',
      },
    }),
  ]);
};
