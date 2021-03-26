import React from 'react';
import Loadable from 'react-loadable';

// Workaround for SSR issue with Plotly
// load it dynamically only on client
const LoadableComponent = Loadable({
  loader: () => import('./plotly'),
  loading() {
    return <div>Loading plotly...</div>;
  },
});

export default ({ ...props }) => <LoadableComponent {...props} />;
