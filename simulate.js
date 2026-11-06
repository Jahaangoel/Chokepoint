/* Chokepoint — simulator page */
(async function () {
  const M = window.CP_MODEL, F = window.CP_FACTS, G = window.CP_GEO, C = window.CP;
  const qs = new URLSearchParams(location.search);
  const state = {
    id: M.STRAITS[qs.get('s')] ? qs.get('s') : 'hormuz',
    sev: M.SEVERITY[qs.get('sev')] ? qs.get('sev') : 'full',
    dur: M.DURATION[qs.get('dur')] ? qs.get('dur') : '1m',
    k: M.K_DEFAULT, win: 'crisis', mkt: 'IN', q: '', sort: 'move', dir: 1, all: false,
  };
  const ids = Object.keys(M.STRAITS);

  // ---- controls
  const list = document.getElementById('strait-list');
  list.innerHTML = ids.map(id => `<li><button type="button" data-id="${id}"><span class="nm">${G.straits[id].name}</span><span class="fl">${M.STRAITS[id].flow} mb/d</span><span class="ds">${F.straits[id].one}</span></button></li>`).join('');
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { state.id = b.dataset.id; update(true); } });
  function seg(el, opts, key) {
    el.innerHTML = opts.map(([v, t]) => `<button type="button" data-v="${v}">${t}</button>`).join('');
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { state[key] = b.dataset.v; update(key === 'id'); } });
  }
  seg(document.getElementById('sev'), [['disrupted', 'Disrupted'], ['partial', 'Half shut'], ['full', 'Fully shut']], 'sev');
  seg(document.getElementById('dur'), [['1w', '1 week'], ['1m', '1 month'], ['3m', '3 months']], 'dur');
  seg(document.getElementById('win'), [['crisis', '2026 crisis'], ['base', 'Normal times']], 'win');
  const kEl = document.getElementById('k');
  kEl.value = state.k;
  kEl.addEventListener('input', () => { state.k = +kEl.value; update(); });
  document.getElementById('more').addEventListener('click', () => { state.all = !state.all; renderTable(); });
  document.getElementById('q').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); renderTable(); });
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = `<button role="tab" data-m="IN">India</button><button role="tab" data-m="US">United States</button>`;
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { state.mkt = b.dataset.m; renderTable(); } });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,textarea,select')) return;
    const i = ids.indexOf(state.id);
    if (e.key === 'ArrowDown' || e.key === 'j') { state.id = ids[(i + 1) % ids.length]; update(true); e.preventDefault(); }
    if (e.key === 'ArrowUp' || e.key === 'k') { state.id = ids[(i - 1 + ids.length) % ids.length]; update(true); e.preventDefault(); }
  });

  // ---- map
  const map = new AtlasMap(document.getElementById('map'), { onSelect: id => { if (M.STRAITS[id]) { state.id = id; update(true); } } });
  await map.load('data/countries-50m.json');
  map.fitSmall();
  map.setValues(Object.fromEntries(ids.map(id => [id, M.STRAITS[id].flow + ' mb/d'])));

  // ---- data
  let stocks = [];
  C.dataStatus(document.getElementById('status'));
  try { stocks = (await C.json('data/stocks.json')).stocks; } catch (e) { stocks = []; }

  let sc;
  function update(moved) {
    sc = M.scenario(state.id, state.sev, state.dur, state.k);
    // controls state
    list.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === state.id));
    document.querySelectorAll('#sev button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.sev));
    document.querySelectorAll('#dur button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.dur));
    document.querySelectorAll('#win button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.win));
    document.getElementById('k-val').textContent = state.k.toFixed(1) + '%';
    const url = `?s=${state.id}&sev=${state.sev}&dur=${state.dur}`;
    history.replaceState(null, '', url);

    // verdict
    const name = G.straits[state.id].name;
    const big = sc.oil >= 0.005;
    document.getElementById('verdict').innerHTML = big
      ? `If the <b>${name}</b> were <b>${sc.sevLabel}</b> for <b>${sc.durLabel}</b>, the model expects Brent to rise <em>about ${Math.round(sc.oil * 100)}%</em>, from $${M.BASE_PRICE.toFixed(0)} to roughly <span class="num">$${sc.price.toFixed(0)}</span> a barrel.`
      : `If the <b>${name}</b> were only <b>${sc.sevLabel}</b>, bypass routes could carry most of the oil, and the model expects <em>little change</em> in the price of Brent.`;
    document.getElementById('why').textContent = sc.why;

    // map
    const routes = {};
    sc.blocks.forEach(r => routes[r] = state.sev === 'full' ? 'blocked' : 'slowed');
    sc.reroute.forEach(r => routes[r] = 'reroute moving');
    if (state.sev !== 'full') sc.blocks.forEach(r => routes[r] = 'slowed moving');
    const pipes = {}; sc.pipes.forEach(p => pipes[p] = 'on');
    map.setScenario({ routes, pipes, zones: [state.id] });
    map.select(state.id);

    // chain
    const lostTxt = sc.kind === 'loss'
      ? `${sc.lost.toFixed(1)} million barrels a day can’t get out, after ${M.STRAITS[state.id].bypass} go by pipeline`
      : `Detours delay about ${sc.lost.toFixed(1)} million barrels a day in the first month`;
    const items = [
      ['Oil supply hit', lostTxt, `${sc.lostPct.toFixed(1)}% of world`],
      ['Brent crude', 'Price per barrel', `<span class="loss">${C.arrow(sc.oil)} ${C.pct(sc.oil, 0)}</span>`],
      ['India’s crude bill', 'Extra cost per year at today’s import volumes', `<span class="loss">+$${Math.round(sc.indiaBill)}bn</span>`],
      ['US petrol', 'Crude cost per gallon, before taxes and margins', `<span class="loss">+$${sc.usPetrol.toFixed(2)}</span>`],
    ];
    if (F.straits[state.id].extraChain) items.push(F.straits[state.id].extraChain);
    document.getElementById('chain').innerHTML = items.map((it, i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="w">${it[0]}<small>${it[1]}</small></span><span class="v">${it[2]}</span></li>`).join('');
    document.getElementById('reality').innerHTML = F.straits[state.id].reality;

    renderMovers();
    renderTable();
    if (moved) { /* keep world view in the simulator: detours matter */ }
  }

  function rows() {
    return stocks.filter(s => s.market === state.mkt).map(s => {
      const { B, se } = M.pickB(s, state.win);
      const mv = B == null ? null : M.move(B, sc.oil);
      return { s, B, se, mv, rng: B == null ? null : M.moveRange(B, se, sc.oil) };
    });
  }

  function renderMovers() {
    const box = document.getElementById('movers');
    const all = stocks.map(s => { const { B } = M.pickB(s, state.win); return { s, mv: B == null ? null : M.move(B, sc.oil) }; }).filter(r => r.mv != null);
    const by = (mkt, dir) => all.filter(r => r.s.market === mkt).sort((a, b) => dir * (a.mv - b.mv)).slice(0, 3);
    const li = r => `<li style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--rule)"><span><span class="num" style="font-weight:500">${C.esc(r.s.ticker.replace('.NS', ''))}</span> <span class="small">${C.esc(r.s.name)}</span></span><span class="num ${C.cls(r.mv)}">${C.arrow(r.mv)} ${C.pct(r.mv)}</span></li>`;
    const col = (title, arr) => `<div style="flex:1 1 240px;min-width:0"><h3 class="h-sub" style="font-size:18px">${title}</h3><ul style="list-style:none;margin:0;padding:0;border-top:1px solid var(--rule-strong)">${arr.map(li).join('')}</ul></div>`;
    box.innerHTML = all.length ? col('India: hit hardest', by('IN', 1)) + col('India: best placed', by('IN', -1)) + col('US: hit hardest', by('US', 1)) + col('US: best placed', by('US', -1)) : '';
  }

  function renderTable() {
    tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.m === state.mkt));
    let r = rows();
    if (state.q) r = r.filter(x => (x.s.ticker + ' ' + x.s.name + ' ' + x.s.sector).toLowerCase().includes(state.q));
    const key = { move: x => x.mv ?? 0, name: x => x.s.name, sector: x => x.s.sector, B: x => x.B ?? 0 }[state.sort];
    r.sort((a, b) => { const A = key(a), B = key(b); return (A > B ? 1 : A < B ? -1 : 0) * state.dir; });
    const total = r.length;
    const maxAbs = Math.max(0.05, ...r.map(x => Math.abs(x.mv || 0)));
    if (!state.all && !state.q) r = r.slice(0, 15);
    const more = document.getElementById('more');
    more.hidden = state.q || total <= 15;
    more.textContent = state.all ? 'Show the top 15 only' : `Show all ${total} stocks`;
    const th = (k, t, c = '') => `<th scope="col" class="${c}"><button type="button" data-sort="${k}">${t}${state.sort === k ? (state.dir > 0 ? ' ↑' : ' ↓') : ''}</button></th>`;
    document.getElementById('tbl').innerHTML = `<thead><tr>${th('name', 'Stock')}${th('sector', 'Sector')}${th('B', 'Sensitivity to oil', 'r')}<th scope="col">Estimated move</th>${th('move', '', 'r')}<th scope="col">Why it’s exposed</th></tr></thead><tbody>${r.map(x => {
      const w = x.mv == null ? 0 : Math.min(50, Math.abs(x.mv) / maxAbs * 50);
      const ci = x.se != null && x.B != null ? `<span class="ci">${C.num(x.B - 1.96 * x.se)} to ${C.num(x.B + 1.96 * x.se)}</span>` : '';
      const weak = x.se != null && x.B != null && (x.B - 1.96 * x.se) < 0 && (x.B + 1.96 * x.se) > 0;
      return `<tr><td><span class="t">${C.esc(x.s.ticker.replace('.NS', ''))}</span><span class="nm">${C.esc(x.s.name)}${x.s.list === 'Oil-sensitive extras' ? ' · extra' : ''}</span></td>
<td class="small">${C.esc(x.s.sector)}</td>
<td class="r num">${C.num(x.B)}<br>${ci}</td>
<td><div class="bar" aria-hidden="true"><i class="${(x.mv || 0) < 0 ? 'neg' : 'pos'}" style="width:${w}%"></i></div></td>
<td class="r num ${C.cls(x.mv)}">${x.mv == null ? 'No data' : C.arrow(x.mv) + ' ' + C.pct(x.mv)}${weak ? '<br><span class="ci">weak link</span>' : ''}</td>
<td class="small" style="max-width:280px">${C.esc(x.s.note)}</td></tr>`;
    }).join('')}</tbody>`;
    document.querySelectorAll('#tbl th button').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.sort; if (state.sort === k) state.dir *= -1; else { state.sort = k; state.dir = k === 'name' || k === 'sector' ? 1 : 1; } renderTable();
    }));
  }

  update(true);
})();
