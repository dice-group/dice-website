const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, 'static', 'data');
const outFile = path.join(outDir, 'linkedin.json');

const ORG_ID = process.env.LINKEDIN_ORG_ID || '88654324';
const TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const VERSION = process.env.LINKEDIN_VERSION || '202507';

function writeEmptyFeed(msg) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ urns: [] }, null, 2));
  console.warn(`[linkedin] ${msg} -> wrote empty feed and continued.`);
}

if (!TOKEN) {
  writeEmptyFeed('No LINKEDIN_ACCESS_TOKEN set (likely PR or local dev)');
  process.exit(0);
}

const url = new URL('https://api.linkedin.com/rest/posts');
url.searchParams.set('q', 'owners');
url.searchParams.set('owners', `urn:li:organization:${ORG_ID}`);
url.searchParams.set('sortBy', 'LAST_MODIFIED');
url.searchParams.set('count', '3');

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'LinkedIn-Version': VERSION,
  'X-Restli-Protocol-Version': '2.0.0',
  Accept: 'application/json',
};

https
  .get(url, { headers }, res => {
    let body = '';
    res.on('data', c => (body += c));
    res.on('end', () => {
      if (res.statusCode !== 200) {
        return writeEmptyFeed(`API error ${res.statusCode}`);
      }
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        return writeEmptyFeed('Bad JSON from API');
      }
      const urns = (data.elements || [])
        .map(e => e.id)
        .filter(Boolean)
        .slice(0, 3);

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, 'linkedin.json'),
        JSON.stringify({ urns }, null, 2)
      );
      console.log('[linkedin] Saved', urns);
    });
  })
  .on('error', e => {
    writeEmptyFeed(`Request failed: ${e.message}`);
  });
