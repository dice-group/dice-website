(function () {
  'use strict';

  function qs(sel) {
    return document.querySelector(sel);
  }
  function setText(el, txt) {
    el.textContent = txt;
  }

  function mk(tag, cls, txt) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt != null) setText(el, txt);
    return el;
  }

  function row(label, value, withCopy) {
    const p = mk('p', 'row');
    p.appendChild(mk('strong', null, label));
    const code = mk('code');
    setText(code, value);
    p.appendChild(code);
    if (withCopy && navigator.clipboard?.writeText) {
      const b = mk('button', 'copy', 'Copy');
      b.addEventListener('click', () => navigator.clipboard.writeText(value));
      p.appendChild(b);
    }
    return p;
  }

  function parseParams() {
    const q = new URLSearchParams(location.search);
    const h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    return {
      url: location.href,
      code: q.get('code') || h.get('code') || '',
      state: q.get('state') || h.get('state') || '',
      error: q.get('error') || h.get('error') || '',
      error_description:
        q.get('error_description') || h.get('error_description') || '',
    };
  }

  function stripQuery() {
    try {
      const clean = location.pathname + (location.hash || '');
      history.replaceState(null, '', clean);
    } catch (_) {}
  }

  function main() {
    const out = qs('#out');
    const { url, code, state, error, error_description } = parseParams();

    out.appendChild(row('URL:', url, false));

    if (code) {
      out.appendChild(row('Code:', code, true));
      out.appendChild(row('State:', state || '(missing)', false));
      out.appendChild(
        mk('p', 'success', 'Success - use this code in the workflow.')
      );
    } else if (error) {
      out.appendChild(row('Error:', error, false));
      out.appendChild(row('Description:', error_description || '', false));
      out.appendChild(row('State:', state || '(missing)', false));
    } else {
      out.appendChild(
        mk(
          'p',
          null,
          'No code and no error found. (The query string may have been stripped by a redirect.)'
        )
      );
      out.appendChild(row('State:', state || '(missing)', false));
    }

    stripQuery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
