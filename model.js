/* Chokepoint — the scenario model. Every number here is explained on method.html. */
window.CP_MODEL = (function () {
  // Pre-crisis oil flows, million barrels a day (EIA, first half of 2025; Panama is fiscal 2025)
  const STRAITS = {
    hormuz: {
      flow: 20.9, kind: 'loss', bypass: 4.5,
      blocks: ['gulfIndia', 'gulfAsia', 'gulfEurope'], reroute: ['yanbuOut'], pipes: ['eastWest', 'adcop'],
      why: 'Most Gulf oil has no other way out. Pipelines can carry part of it around the strait; the rest is simply lost to the market.',
    },
    malacca: {
      flow: 23.2, kind: 'detour', extraDays: 3,
      blocks: ['gulfAsia', 'asiaEurope'], reroute: ['lombok'], pipes: [],
      why: 'Ships can go round through Indonesia’s Lombok or Sunda straits. Oil still arrives, but later, so for a while less of it is available.',
    },
    bab: {
      flow: 4.2, kind: 'detour', extraDays: 15,
      blocks: ['gulfEurope', 'asiaEurope'], reroute: ['capeGulf', 'capeAsia'], pipes: [],
      why: 'Ships sail round Africa instead. The US Energy Information Administration estimates the detour adds about 15 days from the Arabian Sea to Europe.',
    },
    suez: {
      flow: 4.9, kind: 'detour', extraDays: 15,
      blocks: ['gulfEurope', 'asiaEurope'], reroute: ['capeGulf', 'capeAsia'], pipes: [],
      why: 'Same detour round the Cape of Good Hope. The SUMED pipeline can move some crude across Egypt, which softens the blow.',
    },
    panama: {
      flow: 2.3, kind: 'detour', extraDays: 12,
      blocks: ['usPanama'], reroute: ['usCape'], pipes: [],
      why: 'Mostly a gas and fuel route from the US to Asia. Tankers already go round Africa when the canal is restricted.',
    },
  };
  const WORLD = 104;        // world oil demand, mb/d (IEA, first half of 2025)
  const K_DEFAULT = 4.6;    // % rise in Brent per 1% of world supply lost (calibrated on 2026, see method)
  const BASE_PRICE = 71.32; // EIA Brent spot, 27 Feb 2026 — the last day before the war
  const SEVERITY = { disrupted: 0.3, partial: 0.6, full: 1.0 };
  const SEV_LABEL = { disrupted: 'disrupted', partial: 'half shut', full: 'fully shut' };
  const DURATION = { '1w': { loss: 0.5, detour: 0.5, label: 'one week' }, '1m': { loss: 1.0, detour: 1.0, label: 'one month' }, '3m': { loss: 1.2, detour: 0.7, label: 'three months' } };
  const INDIA_IMPORTS = 5.0; // mb/d of crude (S&P Global, 2026)

  function scenario(id, sev, dur, k = K_DEFAULT) {
    const s = STRAITS[id];
    const share = SEVERITY[sev];
    let lost;
    if (s.kind === 'loss') lost = Math.max(0, s.flow * share - s.bypass);
    else lost = s.flow * share * Math.min(s.extraDays, 30) / 30;
    const durF = DURATION[dur][s.kind];
    const lostPct = lost / WORLD * 100;
    const oil = k * lostPct * durF / 100;             // e.g. 0.72 = +72%
    const price = BASE_PRICE * (1 + oil);
    const dPrice = price - BASE_PRICE;
    return {
      id, sev, dur, lost, lostPct, oil, price, dPrice,
      indiaBill: INDIA_IMPORTS * dPrice * 365 / 1000,   // US$ billion a year
      usPetrol: dPrice / 42,                              // US$ per gallon, crude cost only
      blocks: s.blocks, reroute: s.reroute, pipes: s.pipes, why: s.why,
      sevLabel: SEV_LABEL[sev], durLabel: DURATION[dur].label, kind: s.kind,
    };
  }

  // stock move for an oil shock, using log returns: move = exp(B·ln(1+s)) − 1
  function move(B, oil) { return Math.exp(B * Math.log(1 + oil)) - 1; }
  function moveRange(B, se, oil) {
    if (se == null) return null;
    return [move(B - 1.96 * se, oil), move(B + 1.96 * se, oil)].sort((a, b) => a - b);
  }

  function pickB(stock, window) {
    if (window === 'base') return { B: stock.B_base_s ?? stock.B_base, se: stock.B_base_se, raw: stock.B_base };
    return { B: stock.B_crisis_s ?? stock.B_crisis ?? stock.B_base_s, se: stock.B_crisis_se ?? stock.B_base_se, raw: stock.B_crisis };
  }

  // 0–10 score: 1 point for every 2% the portfolio is expected to lose if Brent rises 50%
  function riskScore(holdings, stocksByTicker) {
    let tot = 0, w = 0, rows = [];
    holdings.forEach(h => {
      const s = stocksByTicker[h.ticker];
      if (!s || s.B_adverse == null) return;
      const m = move(s.B_adverse, 0.5);
      rows.push({ ticker: h.ticker, weight: h.weight, move: m, contrib: h.weight * m });
      tot += h.weight * m; w += h.weight;
    });
    if (!w) return null;
    const pm = tot / w;
    const loss = -pm * 100;
    const score = Math.max(0, Math.min(10, loss / 2));
    const label = pm > 0.005 ? 'Oil-hedged' : score < 2 ? 'Low' : score < 4 ? 'Moderate' : score < 6.5 ? 'Elevated' : 'High';
    return { score, label, portfolioMove: pm, rows: rows.map(r => ({ ...r, contrib: r.contrib / w })) };
  }

  return { STRAITS, WORLD, K_DEFAULT, BASE_PRICE, SEVERITY, DURATION, INDIA_IMPORTS, scenario, move, moveRange, pickB, riskScore };
})();
