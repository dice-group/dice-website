
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
            const err = new Error(
              `Token POST ${res.statusCode} :: ${body.slice(0, 200)}`
            );
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
    throw new Error(
      'Missing LINKEDIN_REFRESH_TOKEN / CLIENT_ID / CLIENT_SECRET'
    );
  }

  const payload = {
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  if (REDIRECT_URI) payload.redirect_uri = REDIRECT_URI;

  const tok = await postForm(
    'https://www.linkedin.com/oauth/v2/accessToken',
    payload
  );

  if (!tok.access_token) {
    throw new Error('No access_token returned on refresh');
  }

  ACCESS_TOKEN = tok.access_token;

  try {
    fs.writeFileSync(
      path.join(__dirname, 'new_tokens.json'),
      JSON.stringify(tok, null, 2)
    );
  } catch (e) {
    console.warn('[linkedin] Could not save refreshed tokens:', e.message);
  }

  return ACCESS_TOKEN;
}

// Fetch a page, refreshing the access token if necessary.
async function fetchPage(url) {
  const headers = { 'X-RestLi-Method': 'FINDER' };

  try {
    return await getJSON(url, headers);
  } catch (e) {
    if (e.statusCode !== 401) throw e;

    console.warn('[linkedin] 401 Unauthorized, attempting refresh...');
    await refreshAccessToken();

    return await getJSON(url, headers);
  }
}

// Fetch up to three posts, following LinkedIn's next-page links.
async function fetchLatestPosts() {
  const postsUrl = new URL('https://api.linkedin.com/rest/posts');

  postsUrl.searchParams.set('q', 'author');
  postsUrl.searchParams.set('author', `urn:li:organization:${ORG_ID}`);
  postsUrl.searchParams.set('sortBy', 'CREATED');
  postsUrl.searchParams.set('count', '3');

  const urns = [];
  const seenUrls = new Set();

  let currentUrl = postsUrl;
  let pageNumber = 0;

  while (currentUrl && urns.length < 3) {
    if (seenUrls.has(currentUrl.href)) {
      throw new Error('Repeated LinkedIn pagination URL');
    }

    seenUrls.add(currentUrl.href);
    pageNumber++;

    // Safety limit against unexpected API pagination loops.
    if (pageNumber > 20) {
      throw new Error('Exceeded LinkedIn pagination limit');
    }

    const page = await fetchPage(currentUrl);

    // Diagnostic output
    console.log(`[linkedin] PAGE ${pageNumber}:`, {
      paging: page.paging,
      returned: page.elements?.length || 0,
      urns: page.elements?.map(p => p.id) || [],
    });

    // Collect unique post URNs.
    for (const post of page.elements || []) {
      if (post.id && !urns.includes(post.id)) {
        urns.push(post.id);
      }

      if (urns.length === 3) break;
    }

    if (urns.length === 3) break;

    // Follow LinkedIn's actual next-page link.
    const nextLink = page.paging?.links?.find(
      link => link.rel === 'next'
    );

    if (!nextLink) {
      console.log('[linkedin] No more pages available.');
      break;
    }

    const nextUrl = new URL(
      nextLink.href,
      'https://api.linkedin.com'
    );

    if (
      nextUrl.origin !== 'https://api.linkedin.com' ||
      nextUrl.pathname !== '/rest/posts'
    ) {
      throw new Error('Unexpected LinkedIn pagination URL');
    }

    currentUrl = nextUrl;
  }

  return urns;
}

(async () => {
  try {
    const urns = await fetchLatestPosts();

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify({ urns }, null, 2));

    console.log('[linkedin] Saved URNs:', urns);
  } catch (e) {
    console.error('[linkedin] Fetch failed:', e.message);

    // Preserve the previous file if one exists.
    if (!fs.existsSync(outFile)) {
      writeEmptyFeed('No previous feed available');
    }

    process.exitCode = 1;
  }
})();
