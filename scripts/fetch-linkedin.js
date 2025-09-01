const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, 'static', 'data');
const outFile = path.join(outDir, 'linkedin.json');

const ORG_ID = process.env.LINKEDIN_ORG_ID || '88654324';
const TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const VERSION = process.env.LINKEDIN_VERSION || '202508';

function writeEmptyFeed(msg) {
  try {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify({ urns: [] }, null, 2));
  } catch {}
  console.warn(`[linkedin] ${msg} -> wrote empty feed and continued.`);
}

if (!TOKEN) {
  writeEmptyFeed('No LINKEDIN_ACCESS_TOKEN set (likely PR or local dev)');
  process.exit(0);
}

function getJSON(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      Authorization: `Bearer ${TOKEN}`,
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
            return reject(
              new Error(
                `API error ${
                  res.statusCode
                } for ${url.toString()} :: ${body.slice(0, 200)}`
              )
            );
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

(async () => {
  try {
    const postsUrl = new URL('https://api.linkedin.com/rest/posts');
    postsUrl.searchParams.set('q', 'author');
    postsUrl.searchParams.set('author', `urn:li:organization:${ORG_ID}`);
    postsUrl.searchParams.set('sortBy', 'CREATED');
    postsUrl.searchParams.set('count', '3');
    const posts = await getJSON(postsUrl, { 'X-RestLi-Method': 'FINDER' });
    const urns = (posts.elements || [])
      .map(e => e.id)
      .filter(Boolean)
      .slice(0, 3);

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify({ urns }, null, 2));
    console.log('[linkedin] Saved URNs:', urns);
  } catch (e) {
    writeEmptyFeed(`Fetch failed: ${e.message}`);
  }
})();
