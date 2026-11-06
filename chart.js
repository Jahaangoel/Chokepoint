/* Chokepoint — annotated Brent chart */
window.BrentChart = function (el, series, events, opts = {}) {
  const W = el.clientWidth && el.clientWidth < 640 ? 620 : 1000, H = opts.height || (W < 1000 ? 420 : 380), m = { t: 34, r: 24, b: 30, l: 46 };
  const from = opts.from || '2025-11-01';
  const data = series.filter(d => d[0] >= from).map(d => ({ date: new Date(d[0] + 'T00:00:00'), v: d[1] }));
  const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([m.l, W - m.r]);
  const y = d3.scaleLinear().domain([Math.min(50, d3.min(data, d => d.v) - 5), Math.max(140, d3.max(data, d => d.v) + 5)]).nice().range([H - m.b, m.t]);
  el.innerHTML = '';
  el.style.position = 'relative';
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
    .attr('aria-label', opts.aria || 'Brent crude oil price, with key events of the 2026 crisis marked');
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line')
    .attr('x1', m.l).attr('x2', W - m.r).attr('y1', d => y(d)).attr('y2', d => y(d));
  svg.append('g').attr('class', 'axis').selectAll('text').data(y.ticks(5)).join('text')
    .attr('x', m.l - 8).attr('y', d => y(d) + 4).attr('text-anchor', 'end').text(d => '$' + d);
  svg.append('g').attr('class', 'axis').selectAll('text').data(x.ticks(d3.timeMonth.every(1))).join('text')
    .attr('x', d => x(d)).attr('y', H - 8).attr('text-anchor', 'middle').text(d => d3.timeFormat(d.getMonth() === 0 ? '%b %Y' : '%b')(d));

  const war = new Date('2026-02-28T00:00:00');
  if (war >= x.domain()[0]) {
    svg.append('rect').attr('x', x(war)).attr('y', m.t).attr('width', W - m.r - x(war)).attr('height', H - m.b - m.t).attr('fill', '#EDE6D8').attr('opacity', .55);
    svg.append('text').attr('class', 'ann-s').attr('x', x(war) + 6).attr('y', m.t + 12).text('War with Iran');
  }
  const area = d3.area().x(d => x(d.date)).y0(H - m.b).y1(d => y(d.v)).curve(d3.curveMonotoneX);
  const line = d3.line().x(d => x(d.date)).y(d => y(d.v)).curve(d3.curveMonotoneX);
  svg.append('path').attr('class', 'area').attr('d', area(data));
  svg.append('path').attr('class', 'line').attr('d', line(data));

  // event markers
  const ev = svg.append('g').attr('class', 'ev');
  const evs = (events || []).map((e, i) => ({ ...e, i: i + 1, d: new Date(e.date + 'T00:00:00') })).filter(e => e.d >= x.domain()[0] && e.d <= x.domain()[1]);
  let lastX = -99, lift = false;
  evs.forEach(e => { const px = x(e.d); lift = px - lastX < 20 ? !lift : false; e.cy = lift ? -8 : 12; lastX = px; });
  const g = ev.selectAll('g').data(evs).join('g');
  g.append('line').attr('x1', d => x(d.d)).attr('x2', d => x(d.d)).attr('y1', d => d.cy + 4).attr('y2', H - m.b);
  g.append('circle').attr('cx', d => x(d.d)).attr('cy', d => d.cy).attr('r', 9);
  g.append('text').attr('x', d => x(d.d)).attr('y', d => d.cy + 3.5).attr('text-anchor', 'middle').text(d => d.i);

  // labelled highs/lows
  (opts.notes || []).forEach(n => {
    const p = data.find(d => d3.timeFormat('%Y-%m-%d')(d.date) === n.date);
    if (!p) return;
    svg.append('circle').attr('cx', x(p.date)).attr('cy', y(p.v)).attr('r', 3.5).attr('fill', '#1C1A16');
    svg.append('text').attr('class', 'ann').attr('x', x(p.date) + (n.dx || 8)).attr('y', y(p.v) + (n.dy || -8)).attr('text-anchor', n.anchor || 'start').text(n.text.replace('{v}', '$' + p.v.toFixed(0)));
  });

  // hover
  const tip = document.createElement('div'); tip.className = 'tip'; el.appendChild(tip);
  const hl = svg.append('line').attr('class', 'hover-line').attr('y1', m.t).attr('y2', H - m.b).style('opacity', 0);
  const dot = svg.append('circle').attr('r', 4).attr('fill', '#B3261E').style('opacity', 0);
  const bis = d3.bisector(d => d.date).center;
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', e => {
      const [px] = d3.pointer(e); const d = data[bis(data, x.invert(px))];
      hl.attr('x1', x(d.date)).attr('x2', x(d.date)).style('opacity', 1); dot.attr('cx', x(d.date)).attr('cy', y(d.v)).style('opacity', 1);
      const r = el.getBoundingClientRect(); const sx = r.width / W;
      tip.style.left = x(d.date) * sx + 'px'; tip.style.top = y(d.v) * sx + 'px'; tip.style.opacity = 1;
      const near = evs.find(v => Math.abs(v.d - d.date) < 2.5 * 864e5);
      tip.innerHTML = `${d3.timeFormat('%-d %b %Y')(d.date)} · <b>$${d.v.toFixed(2)}</b>${near ? '<br>' + near.i + '. ' + near.short : ''}`;
    })
    .on('pointerleave', () => { hl.style('opacity', 0); dot.style('opacity', 0); tip.style.opacity = 0; });
  return { x, y };
};
