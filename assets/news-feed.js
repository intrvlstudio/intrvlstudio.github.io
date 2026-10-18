/* Shared news feed for the homepage bulletin and /news/.
   Sources: /assets/news/news.json (curated archive) + /assets/announcements.json (the latest official Instagram post,
   updated by the studio; it is merged in automatically when its URL is not already listed). */
(() => {
  'use strict';
  const SAFE_URL = /^(https:\/\/|\/(?!\/))/;
  const SAFE_IMG = /^\/assets\/[\w./-]+$/;
  const pick = (o, lang) => (o && typeof o === 'object' ? (o[lang] || o.zh || o.en || '') : (o || ''));
  const get = url => fetch(url, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : { posts: [] })).catch(() => ({ posts: [] }));
  const dateFromTitle = t => { const m = /(\d{4})[.\-/](\d{2})[.\-/](\d{2})/.exec(t || ''); return m ? `${m[1]}-${m[2]}-${m[3]}` : ''; };
  let cache = null;
  async function load(lang = 'zh') {
    if (!cache) {
      cache = Promise.all([get('/assets/news/news.json'), get('/assets/announcements.json')]).then(([a, b]) => {
        const out = [], urls = new Set();
        for (const p of a.posts || []) {
          out.push(p); if (p.url) urls.add(p.url);
        }
        for (const p of b.posts || []) {
          if (!p.url || urls.has(p.url)) continue;
          const title = String(p.title || '');
          out.push({ id: 'ann-' + p.url, date: dateFromTitle(title), cat: p.category || 'event', url: p.url, title: title.replace(/\s*[｜|]\s*\d{4}[.\-/]\d{2}[.\-/]\d{2}\s*$/, '') });
        }
        return out;
      });
    }
    const list = await cache;
    return list
      .map(p => ({
        id: p.id || p.url || p.date,
        date: p.date || '',
        cat: p.cat || 'event',
        url: SAFE_URL.test(p.url || '') ? p.url : '',
        image: SAFE_IMG.test(p.image || '') ? p.image : '',
        title: pick(p.title, lang),
        body: pick(p.body, lang)
      }))
      .filter(p => p.title)
      .sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  }
  window.INTRVLNewsFeed = { load };
})();
