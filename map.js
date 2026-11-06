/* Chokepoint — atlas map (d3-geo, Equal Earth) */
(function () {
  const G = window.CP_GEO;
  const W = 1200, H = 620;

  function geoLine(points) {
    // densify along great circles so routes curve properly
    const coords = [];
    for (let i = 0; i < points.length - 1; i++) {
      const interp = d3.geoInterpolate(points[i], points[i + 1]);
      const steps = Math.max(2, Math.ceil(d3.geoDistance(points[i], points[i + 1]) * 180 / Math.PI / 0.6));
      for (let k = i === 0 ? 0 : 1; k <= steps; k++) coords.push(interp(k / steps));
    }
    return { type: 'LineString', coordinates: coords };
  }

  class AtlasMap {
    constructor(el, opts = {}) {
      this.el = el;
      this.opts = opts;
      this.onSelect = opts.onSelect || (() => {});
      this.k = 1;
      this.selected = null;
      this.projection = d3.geoEqualEarth().rotate([-25, 0]);
      const viewBox = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-112, -46], [-112, 63], [152, 63], [152, -46], [-112, -46]]] } };
      this.projection.fitExtent([[6, 6], [W - 6, H - 6]], viewBox);
      this.path = d3.geoPath(this.projection);
      this.svg = d3.select(el).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('class', 'map')
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('role', 'group')
        .attr('aria-label', opts.aria || 'Map of the world’s main oil shipping chokepoints');
      const defs = this.svg.append('defs');
      const hatch = defs.append('pattern').attr('id', 'hatch').attr('patternUnits', 'userSpaceOnUse').attr('width', 6).attr('height', 6).attr('patternTransform', 'rotate(45)');
      hatch.append('rect').attr('width', 6).attr('height', 6).attr('fill', 'rgba(179,38,30,0.06)');
      hatch.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).attr('stroke', '#B3261E').attr('stroke-width', 1.4).attr('stroke-opacity', 0.55);
      defs.append('clipPath').attr('id', 'mapclip').append('rect').attr('width', W).attr('height', H);
      this.root = this.svg.append('g').attr('clip-path', 'url(#mapclip)');
      this.g = this.root.append('g');
      this.layers = {};
      ['sphere', 'grat', 'land', 'border', 'zones', 'seas', 'pipes', 'routes', 'ports', 'cps'].forEach(n => this.layers[n] = this.g.append('g').attr('class', 'l-' + n));
    }

    async load(url) {
      const topo = await fetch(url).then(r => r.json());
      this.countries = topojson.feature(topo, topo.objects.countries);
      this.borders = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
      this.land = topojson.merge(topo, topo.objects.countries.geometries);
      this.draw();
      return this;
    }

    draw() {
      const p = this.path, L = this.layers;
      L.sphere.append('path').attr('class', 'sphere').attr('d', p({ type: 'Sphere' }));
      L.grat.append('path').attr('class', 'grat').attr('d', p(d3.geoGraticule().step([15, 15])())).attr('vector-effect', 'non-scaling-stroke');
      L.land.append('path').attr('class', 'land').attr('d', p(this.land)).attr('vector-effect', 'non-scaling-stroke');
      L.border.append('path').attr('class', 'border').attr('d', p(this.borders)).attr('vector-effect', 'non-scaling-stroke');

      // pipelines
      this.pipeSel = L.pipes.selectAll('path').data(Object.entries(G.pipes)).join('path')
        .attr('class', 'pipe idle').attr('d', ([, v]) => p(geoLine(v.path))).attr('vector-effect', 'non-scaling-stroke');
      this.pipeSel.append('title').text(([, v]) => `${v.name}: ${v.cap}`);

      // routes
      this.routeSel = L.routes.selectAll('path').data(Object.entries(G.routes)).join('path')
        .attr('class', ([, v]) => 'route ' + (v.alt ? 'idle' : 'moving'))
        .attr('d', ([, v]) => p(geoLine(v.path))).attr('vector-effect', 'non-scaling-stroke');
      this.routeSel.append('title').text(([, v]) => `${v.name} · ${v.cargo}`);

      this.drawLabels();

      // chokepoints
      const self = this;
      this.cpSel = L.cps.selectAll('g').data(Object.values(G.straits)).join('g')
        .attr('class', 'cp').attr('tabindex', 0).attr('role', 'button')
        .attr('aria-label', d => `${d.name}. Select to see details`)
        .on('click', (e, d) => self.onSelect(d.id))
        .on('keydown', (e, d) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.onSelect(d.id); } });
      this.cpSel.append('circle').attr('class', 'ring');
      this.cpSel.append('circle').attr('class', 'core');
      this.cpSel.append('text').attr('class', 'n');
      this.cpSel.append('text').attr('class', 'v');
      this.placeCps();
    }

    setValues(map) { // {id: '20.9 mb/d'}
      this.values = map;
      this.placeCps();
    }

    placeCps() {
      const k = this.k, P = this.projection;
      const values = this.values || {};
      this.cpSel.each(function (d) {
        const [x, y] = P(d.at);
        const g = d3.select(this);
        g.select('.ring').attr('cx', x).attr('cy', y).attr('r', 8 / k).attr('stroke-width', 1.4 / k);
        g.select('.core').attr('cx', x).attr('cy', y).attr('r', 3.2 / k);
        const dx = d.label[0] * 13 / k, dy = d.label[1] * 14 / k;
        const anchor = d.label[0] > 0 ? 'start' : 'end';
        g.select('.n').attr('x', x + dx).attr('y', y + dy + (d.label[1] > 0 ? 6 / k : 0)).attr('text-anchor', anchor).style('font-size', 13.5 / k + 'px').style('stroke-width', 3.5 / k + 'px').text(d.short);
        g.select('.v').attr('x', x + dx).attr('y', y + dy + (d.label[1] > 0 ? 19 / k : 13 / k)).attr('text-anchor', anchor).style('font-size', 10.5 / k + 'px').style('stroke-width', 3 / k + 'px').text(values[d.id] || '');
      });
    }

    drawLabels() {
      const k = this.k, P = this.projection, zoomed = k > 1.5;
      const seas = G.seas.filter(s => zoomed || !s.zoomOnly);
      this.layers.seas.selectAll('text').data(seas, d => d.name).join('text')
        .attr('class', 'sea-lbl').attr('text-anchor', 'middle')
        .attr('x', d => P(d.at)[0]).attr('y', d => P(d.at)[1])
        .style('font-size', (zoomed ? 13 : 12) / k + 'px').style('stroke-width', 3 / k + 'px')
        .text(d => d.name);
      const ports = G.ports.filter(s => zoomed || !s.zoomOnly);
      const pg = this.layers.ports.selectAll('g').data(ports, d => d.name).join(enter => {
        const g = enter.append('g').attr('class', 'port');
        g.append('circle'); g.append('text'); return g;
      });
      pg.select('circle').attr('cx', d => P(d.at)[0]).attr('cy', d => P(d.at)[1]).attr('r', 2.2 / k);
      pg.select('text').attr('x', d => P(d.at)[0] + 5 / k).attr('y', d => P(d.at)[1] - 4 / k)
        .style('font-size', 10.5 / k + 'px').style('stroke-width', 3 / k + 'px').text(d => d.name);
    }

    select(id) {
      this.selected = id;
      this.cpSel.classed('sel', d => d.id === id);
    }

    zoomTo(id, duration = 1100) {
      let t;
      if (!id && this.home) { return this.zoomTo(this.home, duration); }
      if (!id) { t = { k: 1, x: 0, y: 0 }; }
      else {
        const s = Array.isArray(id) ? { view: id } : G.straits[id];
        const [[x0, y0], [x1, y1]] = this.path.bounds({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[s.view[0][0], s.view[0][1]], [s.view[0][0], s.view[1][1]], [s.view[1][0], s.view[1][1]], [s.view[1][0], s.view[0][1]], [s.view[0][0], s.view[0][1]]]] } });
        const k = Math.min(W / (x1 - x0), H / (y1 - y0)) * 0.95;
        t = { k, x: W / 2 - k * (x0 + x1) / 2, y: H / 2 - k * (y0 + y1) / 2 };
      }
      const from = this.t || { k: 1, x: 0, y: 0 };
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.layers.seas.style('opacity', 0); this.layers.ports.style('opacity', 0);
      const interp = d3.interpolateObject(from, t);
      const self = this;
      this.g.transition().duration(reduce ? 0 : duration).ease(d3.easeCubicInOut)
        .attrTween('transform', () => tt => { const v = interp(tt); self.k = v.k; self.placeCps(); return `translate(${v.x},${v.y}) scale(${v.k})`; })
        .on('end', () => {
          self.t = t; self.k = t.k; self.placeCps(); self.drawLabels();
          self.layers.seas.transition().duration(250).style('opacity', 1);
          self.layers.ports.transition().duration(250).style('opacity', 1);
          self.zones && self.drawZones(self.zones);
        });
    }

    // on small screens, start zoomed on the Indian Ocean so the straits are readable
    fitSmall() {
      if (this.el.clientWidth < 720) { this.home = [[24, -12], [112, 36]]; this.zoomTo(this.home, 0); }
    }

    // scenario: {routes: {name: 'blocked'|'slowed'|'reroute'|'moving'|'idle'}, pipes: {name: 'on'|'idle'}, zones: [ids]}
    setScenario(sc) {
      this.routeSel.attr('class', ([name, v]) => 'route ' + ((sc.routes && sc.routes[name]) || (v.alt ? 'idle' : 'moving')));
      this.pipeSel.attr('class', ([name]) => 'pipe ' + ((sc.pipes && sc.pipes[name]) === 'on' ? '' : 'idle'));
      this.zones = sc.zones || [];
      this.drawZones(this.zones);
    }

    drawZones(ids) {
      const data = ids.map(id => G.straits[id]);
      this.layers.zones.selectAll('path').data(data, d => d.id).join('path')
        .attr('class', 'hatch-zone').attr('vector-effect', 'non-scaling-stroke')
        .attr('d', d => this.path(d3.geoCircle().center(d.at).radius(d.id === 'malacca' ? 2.4 : 1.6)()));
    }
  }

  window.AtlasMap = AtlasMap;
})();
