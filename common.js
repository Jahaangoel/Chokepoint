/* Chokepoint — shared page furniture and helpers */
window.CP = (function () {
  const NAV = [
    ['index.html', 'The map'],
    ['simulate.html', 'Close a strait'],
    ['portfolio.html', 'Your portfolio'],
    ['briefing.html', 'The crisis, explained'],
    ['read.html', 'Read more'],
    ['method.html', 'How it works'],
  ];
  const cache = {};
  function json(url) {
    if (!cache[url]) cache[url] = fetch(url, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });
    return cache[url];
  }
  const pct = (x, d = 1, plus = true) => x == null || isNaN(x) ? '–' : (x > 0 && plus ? '+' : x < 0 ? '−' : '') + Math.abs(x * 100).toFixed(d) + '%';
  const num = (x, d = 2) => x == null || isNaN(x) ? '–' : (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
  const usd = (x, d = 0) => x == null ? '–' : '$' + Math.abs(x).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const cls = x => x == null ? 'flat' : x > 0.0005 ? 'gain' : x < -0.0005 ? 'loss' : 'flat';
  const arrow = x => x == null ? '' : x > 0.0005 ? '▲' : x < -0.0005 ? '▼' : '';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB', opts);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('cp:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cp:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };

  function masthead() {
    const here = location.pathname.split('/').pop() || 'index.html';
    const el = document.getElementById('masthead');
    if (!el) return;
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    el.innerHTML = `
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
  <div class="masthead-top"><span>${today}</span><span class="live" id="live-strip">Loading prices…</span></div>
  <div class="brand"><a class="logo" href="index.html">Chokepoint</a><p class="tag">Where the world’s oil squeezes through — and what happens to markets when it can’t.</p></div>
  <nav class="nav" aria-label="Sections">${NAV.map(([h, t]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
</div>`;
    el.classList.add('masthead');
    Promise.all([json('data/brent.json'), json('data/market.json').catch(() => null)]).then(([b, m]) => {
      const s = b.series, last = s[s.length - 1];
      const pre = s.find(r => r[0] === '2026-02-27');
      const ch = pre ? last[1] / pre[1] - 1 : null;
      let html = `Brent spot <b class="num">${usd(last[1], 2)}</b> <span class="small">(${fmtDate(last[0], { day: 'numeric', month: 'short' })})</span>`;
      if (ch != null) html += ` · <span class="up num">${pct(ch, 0)}</span> since the war began`;
      if (m && m.usdinr && m.usdinr.last) html += ` · ₹<b class="num">${num(m.usdinr.last, 2)}</b> to the dollar`;
      document.getElementById('live-strip').innerHTML = html;
    }).catch(() => { document.getElementById('live-strip').textContent = ''; });
  }

  function footer() {
    const el = document.getElementById('foot');
    if (!el) return;
    el.className = 'wrap';
    el.innerHTML = `<div class="foot"><span>Chokepoint · made by Jahaan</span><span>An educational model, not investment advice. <a href="method.html">How it works and sources</a></span></div>`;
  }

  function presenter() {
    document.addEventListener('keydown', e => {
      if (e.target.closest('input,textarea,select')) return;
      if (e.key === 'p' || e.key === 'P') {
        document.body.classList.toggle('present');
        let hint = document.querySelector('.present-hint');
        if (document.body.classList.contains('present')) {
          if (!hint) { hint = document.createElement('div'); hint.className = 'present-hint'; hint.textContent = 'Presenter mode · press P to exit'; document.body.appendChild(hint); }
        } else if (hint) hint.remove();
      }
    });
  }

  async function dataStatus(el) {
    try {
      const d = await json('data/stocks.json');
      if (d.demo) el.innerHTML = `<div class="banner"><b>Demo numbers.</b> The real stock estimates appear after the first nightly data update runs on GitHub. Until then, stock figures on this page are placeholders.</div>`;
      else if (d.stale) el.innerHTML = `<div class="banner"><b>Data may be out of date.</b> The last update didn’t finish, so these are the estimates from ${fmtDate(d.updated.slice(0, 10))}.</div>`;
      else el.innerHTML = `<p class="small">Stock estimates updated ${fmtDate(d.updated.slice(0, 10))}.</p>`;
    } catch (e) { el.innerHTML = ''; }
  }

  document.addEventListener('DOMContentLoaded', () => { masthead(); footer(); presenter(); });
  return { json, pct, num, usd, cls, arrow, esc, fmtDate, store, dataStatus };
})();
