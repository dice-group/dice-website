import React, { useMemo } from 'react';
import * as styles from './start.module.css';

const CLIENT_ID = process.env.GATSBY_LINKEDIN_CLIENT_ID;
const SCOPES = ['r_organization_social'];

function randomState() {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
  }
  return Math.random().toString(16).slice(2);
}

export default function StartLinkedIn() {
  const url = useMemo(() => {
    if (typeof window === 'undefined' || !CLIENT_ID) return '#';
    const redirect = new URL(
      '/oauth/linkedin/callback/index.html',
      window.location.origin
    ).toString();
    const u = new URL('https://www.linkedin.com/oauth/v2/authorization');
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('client_id', CLIENT_ID);
    u.searchParams.set('redirect_uri', redirect);
    u.searchParams.set('scope', SCOPES.join(' '));
    u.searchParams.set('state', randomState());
    return u.toString();
  }, []);
  return (
    <main className="section">
      <div className="container content">
        <div className={styles.wrap}>
          <h1>Authorize LinkedIn</h1>
          <p>
            Click the button below to log in as <b>Page Admin/Poster</b>.
          </p>
          <div className={styles.btnRow}>
            <a className="button is-link is-medium" href={url}>
              Authorize with LinkedIn
            </a>
          </div>
          <p className={styles.helper}>
            <small>
              After approval you'll see a <code>code</code> and{' '}
              <code>state</code> on the callback page.
            </small>
          </p>
        </div>
      </div>
    </main>
  );
}
