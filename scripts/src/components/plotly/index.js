import React from 'react';

// Workaround for SSR issue with Plotly
// load it dynamically only on client
const ClientSideOnlyPlotly = React.lazy(() => import('./plotly.js'));

export default ({ ...props }) => {
  const isSSR = typeof window === 'undefined';

  return (
    <>
      {!isSSR && (
        <React.Suspense fallback={<div />}>
          <ClientSideOnlyPlotly {...props} />
        </React.Suspense>
      )}
    </>
  );
};
