/* Chokepoint — portfolio stress test */
(async function () {
  const M = window.CP_MODEL, C = window.CP, G = window.CP_GEO;
  C.dataStatus(document.getElementById('status'));
  let data;
  try { data = await C.json('data/stocks.json'); } catch (e) { data = { stocks: [] }; }
  const stocks = data.stocks;
  const by = Object.fromEntries(stocks.map(s => [s.ticker, s]));
  const short = t => t.replace('.NS', '');
  const label = s => `${s.name} (${short(s.ticker)}${s.market === 'IN' ? ', NSE' : ''})`;
  document.getElementById('universe').innerHTML = stocks.map(s => `<option value="${C.esc(label(s))}"></option>`).join('');

  const PRESETS = {
    'A mixed Indian–US portfolio': [['RELIANCE.NS', 18], ['HDFCBANK.NS', 15], ['INDIGO.NS', 10], ['ASIANPAINT.NS', 7], ['ONGC.NS', 5], ['AAPL', 15], ['NVDA', 12], ['XOM', 10], ['DAL', 8]],
    'Nifty’s ten biggest': [['HDFCBANK.NS', 13], ['RELIANCE.NS', 12], ['ICICIBANK.NS', 11], ['INFY.NS', 10], ['BHARTIARTL.NS', 10], ['TCS.NS', 9], ['LT.NS', 9], ['ITC.NS', 9], ['SBIN.NS', 9], ['KOTAKBANK.NS', 8]],
    'US big tech': [['NVDA', 20], ['AAPL', 18], ['MSFT', 18], ['GOOGL', 16], ['AMZN', 16], ['META', 12]],
    'Travel and transport': [['INDIGO.NS', 25], ['DAL', 20], ['UAL', 15], ['CCL', 15], ['FDX', 15], ['ETERNAL.NS', 10]],
    'Oil producers': [['ONGC.NS', 25], ['OIL.NS', 15], ['XOM', 25], ['CVX', 20], ['COP', 15]],
  };
  let holdings = C.store.get('holdings', null) || PRESETS['A mixed Indian–US portfolio'].map(([ticker, amount]) => ({ ticker, amount }));
  holdings = holdings.filter(h => by[h.ticker]);

  const presets = document.getElementById('presets');
  presets.innerHTML = Object.keys(PRESETS).map(k => `<button type="button" class="btn ghost small" data-p="${C.esc(k)}">${C.esc(k)}</button>`).join('');
  presets.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; holdings = PRESETS[b.dataset.p].map(([ticker, amount]) => ({ ticker, amount })).filter(h => by[h.ticker]); render(); });

  function find(q) {
    q = q.trim().toLowerCase(); if (!q) return null;
    const exact = stocks.find(s => label(s).toLowerCase() === q || short(s.ticker).toLowerCase() === q || s.ticker.toLowerCase() === q);
    if (exact) return exact;
    const hits = stocks.filter(s => (s.name + ' ' + s.ticker).toLowerCase().includes(q));
    return hits.length === 1 ? hits[0] : hits.length ? hits.sort((a, b) => a.name.length - b.name.length)[0] : null;
  }
  document.getElementById('add').addEventListener('submit', e => {
    e.preventDefault();
    const pick = document.getElementById('pick'), amt = document.getElementById('amt'), msg = document.getElementById('add-msg');
    const s = find(pick.value);
    const a = parseFloat(amt.value);
    if (!s) { msg.textContent = 'Couldn’t find that stock. Chokepoint covers the Nifty 50, 50 big US companies and about 30 oil-sensitive extras.'; return; }
    if (!(a > 0)) { msg.textContent = 'Enter an amount or a percentage above zero.'; amt.focus(); return; }
    const ex = holdings.find(h => h.ticker === s.ticker);
    if (ex) ex.amount += a; else holdings.push({ ticker: s.ticker, amount: a });
    msg.textContent = `Added ${s.name}.`;
    pick.value = ''; amt.value = ''; pick.focus();
    render();
  });

  const scen = document.getElementById('scen');
  const opts = [['brent50', 'Brent jumps 50% (the score’s test)']].concat(Object.keys(M.STRAITS).map(id => ['s:' + id, `${G.straits[id].name} fully shut for a month`]));
  scen.innerHTML = opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  scen.value = C.store.get('scen', 's:hormuz');
  scen.addEventListener('change', () => { C.store.set('scen', scen.value); render(); });

  let last;
  function render() {
    C.store.set('holdings', holdings);
    const total = holdings.reduce((a, h) => a + h.amount, 0) || 1;
    const hw = holdings.map(h => ({ ...h, weight: h.amount / total }));
    const risk = M.riskScore(hw, by);
    const oil = scen.value === 'brent50' ? 0.5 : M.scenario(scen.value.slice(2), 'full', '1m').oil;

    // holdings table
    const rows = hw.map(h => {
      const s = by[h.ticker]; const mv = s.B_adverse == null ? null : M.move(s.B_adverse, 0.5);
      return { h, s, mv, contrib: mv == null ? null : mv * h.weight };
    }).sort((a, b) => (a.contrib ?? 0) - (b.contrib ?? 0));
    const maxC = Math.max(0.005, ...rows.map(r => Math.abs(r.contrib || 0)));
    document.getElementById('hold').innerHTML = holdings.length ? `<thead><tr><th scope="col">Stock</th><th scope="col" class="r">Share</th><th scope="col" class="r">If Brent +50%</th><th scope="col">Effect on your total</th><th scope="col"><span class="vh">Remove</span></th></tr></thead><tbody>${rows.map(r => `<tr>
<td><span class="t">${C.esc(short(r.s.ticker))}</span><span class="nm">${C.esc(r.s.name)}</span></td>
<td class="r num">${(r.h.weight * 100).toFixed(1)}%</td>
<td class="r num ${C.cls(r.mv)}">${r.mv == null ? 'No data' : C.arrow(r.mv) + ' ' + C.pct(r.mv)}</td>
<td><div style="display:flex;align-items:center;gap:10px"><div class="bar" aria-hidden="true"><i class="${(r.contrib || 0) < 0 ? 'neg' : 'pos'}" style="width:${Math.min(50, Math.abs(r.contrib || 0) / maxC * 50)}%"></i></div><span class="num small ${C.cls(r.contrib)}">${r.contrib == null ? '' : C.pct(r.contrib, 2)}</span></div></td>
<td><button type="button" class="btn ghost small" data-rm="${C.esc(r.h.ticker)}" aria-label="Remove ${C.esc(r.s.name)}">Remove</button></td></tr>`).join('')}</tbody>` : '<tbody><tr><td class="small">No holdings yet. Add a stock above or pick an example.</td></tr></tbody>';
    document.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { holdings = holdings.filter(h => h.ticker !== b.dataset.rm); render(); }));

    // score
    const box = document.getElementById('score');
    if (!risk) { box.innerHTML = '<p class="small">Add at least one stock to get a score.</p>'; document.getElementById('scen-out').innerHTML = ''; last = null; drawCard(); return; }
    const pos = risk.score / 10 * 100;
    const drag = rows.find(r => (r.contrib ?? 0) < 0);
    const hedge = [...rows].reverse().find(r => (r.contrib ?? 0) > 0);
    box.innerHTML = `<p style="margin:6px 0 0;display:flex;align-items:baseline;gap:10px"><span class="serif" style="font-size:84px;line-height:.9;font-weight:500">${risk.score.toFixed(1)}</span><span class="num" style="color:var(--ink-3)">/ 10</span></p>
<p class="serif" style="font-size:24px;margin:4px 0 12px;color:${risk.label === 'Oil-hedged' ? 'var(--gain)' : risk.score >= 4 ? 'var(--red)' : 'var(--ink)'}">${risk.label}</p>
<div aria-hidden="true" style="position:relative;height:10px;background:linear-gradient(90deg,#E9E2D2 0 20%,#E3D5B8 20% 40%,#E5C79A 40% 65%,#E2A58C 65% 100%)"><span style="position:absolute;left:calc(${pos}% - 1px);top:-5px;width:3px;height:20px;background:var(--ink)"></span></div>
<div class="small num" style="display:flex;justify-content:space-between;margin-top:4px"><span>0</span><span>10</span></div>
<dl style="display:grid;grid-template-columns:1fr auto;gap:8px 12px;margin:16px 0 0;font-size:14px">
<dt>If Brent jumped 50%</dt><dd class="num ${C.cls(risk.portfolioMove)}" style="margin:0">${C.pct(risk.portfolioMove)}</dd>
<dt>Biggest drag</dt><dd class="num" style="margin:0">${drag ? short(drag.s.ticker) + ' <span class="loss">' + C.pct(drag.mv, 0) + '</span>' : '–'}</dd>
<dt>Best hedge</dt><dd class="num" style="margin:0">${hedge ? short(hedge.s.ticker) + ' <span class="gain">' + C.pct(hedge.mv, 0) + '</span>' : 'None'}</dd></dl>`;

    // scenario
    let pm = 0, lo = 0, hi = 0, w = 0;
    hw.forEach(h => {
      const s = by[h.ticker]; const { B, se } = M.pickB(s, 'crisis'); if (B == null) return;
      pm += h.weight * M.move(B, oil); const rg = M.moveRange(B, se, oil) || [M.move(B, oil), M.move(B, oil)];
      lo += h.weight * rg[0]; hi += h.weight * rg[1]; w += h.weight;
    });
    if (w) { pm /= w; lo /= w; hi /= w; }
    document.getElementById('scen-out').innerHTML = `<p class="serif" style="font-size:19px;line-height:1.45;margin:0">Brent ${C.pct(oil, 0)} → your portfolio <b class="${C.cls(pm)}">${C.pct(pm)}</b></p><p class="small" style="margin:4px 0 0">Rough range ${C.pct(lo)} to ${C.pct(hi)}, using 2026 crisis sensitivities.</p>`;
    last = { risk, drag, hedge };
    drawCard();
  }

  // ---------- share card
  const cv = document.getElementById('card'), ctx = cv.getContext('2d');
  const nmBox = document.getElementById('nm'), nmChk = document.getElementById('showname');
  nmChk.addEventListener('change', () => { nmBox.hidden = !nmChk.checked; drawCard(); if (nmChk.checked) nmBox.focus(); });
  nmBox.addEventListener('input', drawCard);
  async function drawCard() {
    try { await Promise.all([document.fonts.load('500 120px Newsreader'), document.fonts.load('italic 400 60px Newsreader'), document.fonts.load('500 36px "Plex Sans"'), document.fonts.load('400 30px "Plex Mono"')]); } catch (e) { /* fall back to system fonts */ }
    const Wc = 1080, Hc = 1920, X = 96;
    ctx.fillStyle = '#F5F0E6'; ctx.fillRect(0, 0, Wc, Hc);
    ctx.fillStyle = '#1C1A16';
    ctx.font = '600 64px Newsreader, Georgia, serif'; ctx.fillText('Chokepoint', X, 170);
    ctx.fillRect(X, 205, Wc - 2 * X, 3);
    ctx.font = '500 30px "Plex Sans", Arial'; ctx.fillStyle = '#B3261E';
    const who = nmChk.checked && nmBox.value.trim() ? nmBox.value.trim().slice(0, 24) + '’s portfolio' : 'My portfolio';
    ctx.fillText(who.toUpperCase().split('').join(String.fromCharCode(8202)), X, 300);
    ctx.fillStyle = '#1C1A16'; ctx.font = '500 92px Newsreader, Georgia, serif';
    wrap('How exposed is it to the world’s oil chokepoints?', X, 410, Wc - 2 * X, 100);
    if (!last) { ctx.font = '400 36px "Plex Sans", Arial'; ctx.fillText('Add some stocks to see a score.', X, 900); return; }
    const { risk, drag, hedge } = last;
    ctx.font = '500 360px Newsreader, Georgia, serif'; ctx.fillText(risk.score.toFixed(1), X - 12, 1050);
    const sw = ctx.measureText(risk.score.toFixed(1)).width;
    ctx.font = '400 44px "Plex Mono", monospace'; ctx.fillStyle = '#6A6458'; ctx.fillText('/ 10', X + sw + 10, 1050);
    ctx.font = 'italic 400 72px Newsreader, Georgia, serif'; ctx.fillStyle = risk.label === 'Oil-hedged' ? '#1F5A9E' : risk.score >= 4 ? '#B3261E' : '#1C1A16';
    ctx.fillText(risk.label, X, 1150);
    // meter
    const mw = Wc - 2 * X; const grad = ['#E9E2D2', '#E3D5B8', '#E5C79A', '#E2A58C'];
    [[0, .2], [.2, .4], [.4, .65], [.65, 1]].forEach(([a, b], i) => { ctx.fillStyle = grad[i]; ctx.fillRect(X + a * mw, 1215, (b - a) * mw, 18); });
    ctx.fillStyle = '#1C1A16'; ctx.fillRect(X + risk.score / 10 * mw - 3, 1200, 6, 48);
    const line = (y, l, v, col) => {
      ctx.fillStyle = '#D3C9B6'; ctx.fillRect(X, y - 62, mw, 2);
      ctx.font = '400 38px "Plex Sans", Arial'; ctx.fillStyle = '#47423A'; ctx.fillText(l, X, y);
      ctx.font = '500 40px "Plex Mono", monospace'; ctx.fillStyle = col; const t = ctx.measureText(v).width; ctx.fillText(v, Wc - X - t, y);
    };
    line(1340, 'If Brent jumped 50%', C.pct(risk.portfolioMove), risk.portfolioMove < 0 ? '#B4441C' : '#1F5A9E');
    line(1440, 'Most exposed', drag ? `${short(drag.s.ticker)} ${C.pct(drag.mv, 0)}` : '–', '#B4441C');
    line(1540, 'Best hedge', hedge ? `${short(hedge.s.ticker)} ${C.pct(hedge.mv, 0)}` : 'none', '#1F5A9E');
    ctx.fillStyle = '#1C1A16'; ctx.fillRect(X, 1640, mw, 3);
    ctx.font = '500 40px "Plex Sans", Arial'; ctx.fillText('Test yours:', X, 1720);
    ctx.font = '400 34px "Plex Mono", monospace'; ctx.fillText((location.host + location.pathname.replace(/[^/]*$/, '')).replace(/\/$/, '').slice(0, 44), X, 1775);
    ctx.font = '400 26px "Plex Sans", Arial'; ctx.fillStyle = '#6A6458';
    ctx.fillText(data.demo ? 'Demo data · educational model, not investment advice' : 'Educational model, not investment advice', X, 1840);
  }
  function wrap(text, x, y, max, lh) {
    const words = text.split(' '); let lineT = '';
    for (const w of words) { const t = lineT ? lineT + ' ' + w : w; if (ctx.measureText(t).width > max && lineT) { ctx.fillText(lineT, x, y); y += lh; lineT = w; } else lineT = t; }
    ctx.fillText(lineT, x, y);
  }
  document.getElementById('dl').addEventListener('click', () => {
    const a = document.createElement('a'); a.download = 'chokepoint-card.png'; a.href = cv.toDataURL('image/png'); a.click();
  });
  render();
})();
