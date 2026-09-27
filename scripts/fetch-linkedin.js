const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, 'static', 'data');
const outFile = path.join(outDir, 'linkedin.json');

const ORG_ID = process.env.LINKEDIN_ORG_ID || '88654324';
let ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN || '';
const VERSION = process.env.LINKEDIN_VERSION || '202508';
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.LINKEDIN_REFRESH_TOKEN || '';
const REDIRECT_URI =
  process.env.LINKEDIN_REDIRECT_URI ||
  'https://dice-research.org/oauth/linkedin/callback/index.html';

function writeEmptyFeed(msg) {
  try {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify({ urns: [] }, null, 2));
  } catch (e) {
    console.error('[linkedin] Failed to write empty feed:', e);
    throw e;
  }
  console.warn(`[linkedin] ${msg} -> wrote empty feed and continued.`);
}

if (!ACCESS_TOKEN) {
  writeEmptyFeed('No LINKEDIN_ACCESS_TOKEN set (likely PR or local dev)');
  process.exit(0);
}

function getJSON(url, extraHeaders = {}, token = ACCESS_TOKEN) {
  return new Promise((resolve, reject) => {
    const headers = {
      Authorization: `Bearer ${token}`,
      'LinkedIn-Version': VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
      Accept: 'application/json',
      ...extraHeaders,
    };
    https
      .get(url, { headers }, res => {
        let body = '';
        res.on('data', c => (body += c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            const err = new Error(
              `API error ${res.statusCode} for ${url.toString()} :: ${body.slice(0, 200)}`
            );
            err.statusCode = res.statusCode;
            err.body = body;
            return reject(err);
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Bad JSON: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

function postForm(url, formObj) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(formObj).toString();
    const u = new URL(url);
    const req = https.request(
      {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname + (u.search || ''),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      res => {
        let body = '';
        res.on('data', c => (body += c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            const err = new Error(`Token POST ${res.statusCode} :: ${body.slice(0, 200)}`);
            err.statusCode = res.statusCode;
            return reject(err);
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Bad JSON: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function refreshAccessToken() {
  if (!REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing LINKEDIN_REFRESH_TOKEN / CLIENT_ID / CLIENT_SECRET');
  }
  const payload = {
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };
  if (REDIRECT_URI) payload.redirect_uri = REDIRECT_URI;
  const tok = await postForm('https://www.linkedin.com/oauth/v2/accessToken', payload);
  if (!tok.access_token) throw new Error('No access_token returned on refresh');
  ACCESS_TOKEN = tok.access_token;
  try {
    fs.writeFileSync(
      path.join(__dirname, 'new_tokens.json'),
      JSON.stringify(tok, null, 2)
    );
  } catch (e) {
    console.warn('[linkedin] Could not write new_tokens.json:', e.message);
  }
  return ACCESS_TOKEN;
}

function logPage(label, result) {
  console.log(`[linkedin] ${label}:`, JSON.stringify({
    paging: result.paging || null,
    returned: result.elements?.length ?? 0,
    urns: (result.elements || []).map(post => post.id),
  }, null, 2));
}

(async () => {
  try {
    const postsUrl = new URL('https://api.linkedin.com/rest/posts');
    postsUrl.searchParams.set('q', 'author');
    postsUrl.searchParams.set('author', `urn:li:organization:${ORG_ID}`);
    postsUrl.searchParams.set('sortBy', 'CREATED');
    postsUrl.searchParams.set('count', '3');

    let posts;
    try {
      posts = await getJSON(postsUrl, { 'X-RestLi-Method': 'FINDER' });
    } catch (e) {
      if (e.statusCode === 401) {
        console.warn('[linkedin] 401 Unauthorized, attempting refresh...');
        await refreshAccessToken();
        posts = await getJSON(postsUrl, { 'X-RestLi-Method': 'FINDER' });
      } else {
        throw e;
      }
    }

    // DIAGNOSTIC: Inspect the first page and independently request start=3.
    // Do not merge page 2 into the production feed during this test.
    logPage('PAGE 1 (start=0, count=3)', posts);

    try {
      const nextUrl = new URL(postsUrl);
      nextUrl.searchParams.set('start', '3');
      const next = await getJSON(nextUrl, { 'X-RestLi-Method': 'FINDER' });
      logPage('PAGE 2 (start=3, count=3)', next);
    } catch (e) {
      console.error('[linkedin] PAGE 2 failed:', e.message);
    }

    const urns = (posts.elements || [])
      .map(post => post.id)
      .filter(Boolean)
      .slice(0, 3);

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify({ urns }, null, 2));
    console.log('[linkedin] Saved URNs:', urns);
  } catch (e) {
    console.error('[linkedin] Fetch failed:', e.message);
    writeEmptyFeed(`Fetch failed: ${e.message}`);
    process.exitCode = 1; // Show failed fetch clearly in GitHub Actions.
  }
})();
