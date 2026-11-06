/* Chokepoint — geography: chokepoints, routes, pipelines (lon, lat) */
window.CP_GEO = (function () {
  const straits = {
    hormuz: {
      id: 'hormuz', name: 'Strait of Hormuz', short: 'Hormuz', at: [56.45, 26.55],
      label: [1, -1], view: [[51.2, 21.6], [61.2, 29.4]],
    },
    malacca: {
      id: 'malacca', name: 'Strait of Malacca', short: 'Malacca', at: [101.2, 2.6],
      label: [1, 1], view: [[94.5, -3.5], [108.5, 8.5]],
    },
    bab: {
      id: 'bab', name: 'Bab-el-Mandeb', short: 'Bab-el-Mandeb', at: [43.33, 12.58],
      label: [-1, 1], view: [[38.5, 8.5], [50.5, 18]],
    },
    suez: {
      id: 'suez', name: 'Suez Canal & SUMED', short: 'Suez', at: [32.4, 30.4],
      label: [1, -1], view: [[27.5, 25.5], [37.5, 33.5]],
    },
    panama: {
      id: 'panama', name: 'Panama Canal', short: 'Panama', at: [-79.7, 9.1],
      label: [1, 1], view: [[-86, 4.5], [-73.5, 14]],
    },
    cape: {
      id: 'cape', name: 'Cape of Good Hope', short: 'Cape route', at: [18.47, -34.36],
      label: [-1, 1], view: [[8, -41], [32, -27]], alt: true,
    },
  };

  // waypoint chains
  const W = {
    gulf: [[50.2, 26.6], [52.5, 26.4], [54.8, 26.5], [56.3, 26.55], [57.3, 25.6], [58.8, 23.9]],
    toIndia: [[61.5, 23.0], [64.5, 22.6], [67.5, 22.4], [69.6, 22.45]],
    toAsia: [[62, 19], [70, 11], [77, 7], [80.5, 5.6], [86, 5.8], [94, 6.2], [97.5, 5.4], [100.3, 3.3], [102.5, 1.9], [104.2, 1.25], [106, 3], [109, 8], [112, 13], [116, 18.5], [119.5, 23], [122.2, 30.6], [126, 33], [131, 33.5], [139.8, 35.3]],
    toBab: [[59.4, 21], [57, 18], [53, 14], [48, 12.3], [45, 12.1], [43.4, 12.6]],
    babSuez: [[42, 14.5], [39.6, 18], [37.6, 21.5], [35.8, 24.5], [34, 27.3], [32.6, 29.7], [32.35, 31.3]],
    medEurope: [[28, 33.2], [22, 34.6], [15, 36.8], [10, 37.6], [5, 37.5], [0, 36.8], [-5.6, 35.95], [-9.3, 37], [-9.8, 40], [-9.5, 43.5], [-5.5, 47.5], [-2, 49.6], [1.5, 50.8], [4, 51.95]],
    asiaToBab: [[139.8, 35.0], [131, 33.1], [125.6, 32.6], [121.8, 30.2], [119, 22.6], [115.6, 18.2], [111.6, 12.7], [108.6, 7.6], [105.8, 2.6], [104, 0.95], [102.3, 1.5], [100, 2.9], [97.2, 4.9], [93.5, 5.6], [86, 5.3], [80.4, 5.1], [73, 8.1], [65, 10.7], [55, 12.5], [50, 12.0], [45, 11.7], [43.3, 12.4]],
    capeWest: [[18.5, -35.4], [13, -30], [8, -18], [2, -6], [-8, 2], [-17.5, 12], [-18.6, 21], [-15, 29], [-11.5, 36], [-9.8, 40], [-9.5, 43.5], [-5.5, 47.5], [-2, 49.6], [1.5, 50.8], [4, 51.95]],
    gulfToCape: [[58.8, 23.9], [62, 13], [60, 0], [52, -15], [42, -28], [32, -34.6], [24, -35.8], [18.5, -35.4]],
    asiaToCape: [[80.4, 5.1], [72, -8], [60, -22], [45, -32], [32, -35.2], [24, -36.2], [18.5, -35.4]],
    houstonPanama: [[-94.8, 29.3], [-91, 26.5], [-87, 23], [-85, 21.3], [-84, 18.5], [-81.5, 13.5], [-79.9, 9.4]],
    panamaPacific: [[-79.5, 8.8], [-80, 7.2], [-86, 9.5], [-100, 15], [-115, 21], [-130, 27], [-145, 32]],
    houstonAtlantic: [[-94.8, 29.3], [-90, 25.5], [-84, 24], [-80.5, 25.5], [-76, 27], [-60, 25], [-40, 12], [-25, 0], [-10, -15], [5, -28], [18.5, -35.4]],
    lombok: [[80.4, 5.1], [90, -2], [100, -8], [110, -9.6], [115.7, -8.7], [117.8, -5], [118.6, 0], [119.2, 4.5], [121.5, 9], [121.8, 15], [122.2, 21], [122.2, 30.6], [126, 33], [131, 33.5], [139.8, 35.3]],
    yanbuOut: [[38.06, 24.08], [37.6, 21.5], [39.6, 18], [42, 14.5], [43.4, 12.6], [45, 12.1], [48, 12.3], [53, 14], [57, 15.5], [62, 17], [67.5, 20], [69.6, 22.45]],
  };
  const join = (...parts) => parts.flat();
  const routes = {
    gulfIndia: { path: join(W.gulf, W.toIndia), name: 'Gulf → India', cargo: 'Crude, LPG and LNG' },
    gulfAsia: { path: join(W.gulf, W.toAsia), name: 'Gulf → China, Japan, Korea', cargo: 'Crude and LNG' },
    gulfEurope: { path: join(W.gulf, W.toBab, W.babSuez, W.medEurope), name: 'Gulf → Europe via Suez', cargo: 'Crude and products' },
    asiaEurope: { path: join(W.asiaToBab, W.babSuez, W.medEurope), name: 'Asia → Europe via Suez', cargo: 'Containers and fuel' },
    capeGulf: { path: join(W.gulfToCape, W.capeWest), name: 'Gulf → Europe via the Cape', cargo: 'Detour', alt: true },
    capeAsia: { path: join(W.asiaToCape, W.capeWest), name: 'Asia → Europe via the Cape', cargo: 'Detour', alt: true },
    usPanama: { path: join(W.houstonPanama, W.panamaPacific), name: 'US Gulf Coast → Asia via Panama', cargo: 'LNG, propane, grain' },
    usCape: { path: W.houstonAtlantic, name: 'US Gulf Coast → Asia via the Cape', cargo: 'Detour', alt: true },
    lombok: { path: W.lombok, name: 'Lombok Strait detour', cargo: 'Detour', alt: true },
    yanbuOut: { path: W.yanbuOut, name: 'Saudi crude from Yanbu', cargo: 'Bypass exports', alt: true },
  };
  const pipes = {
    eastWest: { path: [[49.7, 25.9], [46, 25.3], [42, 24.8], [38.06, 24.08]], name: 'Saudi East–West pipeline', cap: '5 mb/d design; ran near 7 mb/d in March 2026' },
    adcop: { path: [[53.6, 23.8], [55, 24.4], [56.35, 25.12]], name: 'UAE Habshan–Fujairah pipeline', cap: '1.5 mb/d nameplate, about 1.8 reported' },
  };
  const ports = [
    { name: 'Ras Tanura', at: [50.16, 26.64], zoomOnly: true },
    { name: 'Fujairah', at: [56.35, 25.12], zoomOnly: true },
    { name: 'Bandar Abbas', at: [56.27, 27.18], zoomOnly: true },
    { name: 'Yanbu', at: [38.06, 24.08], zoomOnly: true },
    { name: 'Jamnagar', at: [69.6, 22.45] },
    { name: 'Shanghai', at: [121.5, 31.2] },
    { name: 'Tokyo', at: [139.8, 35.6] },
    { name: 'Rotterdam', at: [4.1, 51.95] },
    { name: 'Houston', at: [-95.2, 29.7] },
    { name: 'Singapore', at: [103.85, 1.29], zoomOnly: true },
    { name: 'Aden', at: [45.0, 12.8], zoomOnly: true },
    { name: 'Djibouti', at: [43.15, 11.6], zoomOnly: true },
    { name: 'Port Said', at: [32.3, 31.26], zoomOnly: true },
    { name: 'Colón', at: [-79.9, 9.36], zoomOnly: true },
    { name: 'Cape Town', at: [18.42, -33.92], zoomOnly: true },
  ];
  const seas = [
    { name: 'Arabian Sea', at: [64, 15] }, { name: 'Bay of Bengal', at: [88.5, 14.5] },
    { name: 'Indian Ocean', at: [75, -18] }, { name: 'South China Sea', at: [114, 12.5], zoomOnly: false },
    { name: 'Atlantic Ocean', at: [-35, 28] }, { name: 'Pacific Ocean', at: [-128, 8] }, { name: 'to Japan and Korea', at: [-138, 36.5] },
    { name: 'Mediterranean', at: [14, 35.6] }, { name: 'Red Sea', at: [38.6, 20.2], zoomOnly: true },
    { name: 'Persian Gulf', at: [51.8, 27.2], zoomOnly: true }, { name: 'Gulf of Oman', at: [58.6, 24.6], zoomOnly: true },
    { name: 'Gulf of Aden', at: [48.5, 13.0], zoomOnly: true }, { name: 'Caribbean Sea', at: [-76, 15.5], zoomOnly: true },
  ];
  return { straits, routes, pipes, ports, seas };
})();
