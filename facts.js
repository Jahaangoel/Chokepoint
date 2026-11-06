/* Chokepoint — sourced facts. Edit here; every page reads from this file. */
window.CP_FACTS = window.CP_FACTS || {};
window.CP_FACTS.straits = {
  hormuz: {
    one: 'The only sea exit for most Gulf oil and Qatari gas.',
    lede: 'Roughly a fifth of the world’s oil and LNG passes between Iran and Oman. Shipping uses two lanes, each about two miles wide.',
    stats: [
      ['Oil flow before the war', '20.9 mb/d (EIA, 1H 2025)'],
      ['Share of seaborne oil', 'About 25% (IEA, 2025)'],
      ['Where it goes', 'About 80% to Asia; China and India take 44% of the crude (IEA)'],
      ['LNG', 'About 20% of world LNG, mostly from Qatar (IEA)'],
      ['Ways around it', 'Saudi East–West and UAE Habshan–Fujairah pipelines: 3.5–5.5 mb/d of spare room (IEA)'],
      ['In late Oct 2026', 'About 11.7 mb/d in October, falling to 7.3 mb/d in the last week (Kpler, via news)'],
    ],
    india: 'About half of India’s crude imports and roughly 90% of its LPG came through Hormuz in early 2026 (S&P Global).',
    reality: '<p>This one is not hypothetical. After the strikes on Iran began on 28 February 2026, traffic collapsed. The EIA’s Brent spot price went from about $71 on 27 February to a peak of about $138 on 7 April, and averaged roughly 45% above its pre-war level from March to early November.</p><p class="small">The model’s full-closure estimate is higher than that average because in reality the strait was never 100% shut and governments released 400 million barrels from emergency stocks (IEA).</p>',
    extraChain: ['Tanker freight, Gulf to Asia', 'What actually happened in October 2026 (IEA)', '<span class="loss">over 5×</span>'],
  },
  malacca: {
    one: 'The busiest oil route on earth, between Malaysia and Indonesia.',
    lede: 'The shortest sea path from the Gulf to China, Japan and Korea. At its tightest point, the Phillips Channel near Singapore, it is about 2.7 km wide.',
    stats: [
      ['Oil flow', '23.2 mb/d (EIA, 1H 2025) — the largest of any chokepoint'],
      ['Ships a year', 'More than 102,500 (2025)'],
      ['Who depends on it', 'About 75% of China’s seaborne crude (Vortexa)'],
      ['Ways around it', 'Sunda and Lombok straits through Indonesia: longer, but open'],
    ],
    india: 'India sits on the near side, so a Malacca closure hurts China, Japan and Korea far more than India. Indian exporters to East Asia would still face longer voyages.',
    reality: '<p>Malacca has never been closed in modern times. That is exactly why it’s worth stress-testing: it carries more oil than Hormuz, but ships have alternatives, so the model treats it as a delay rather than a loss.</p><p class="small">The detour length is the model’s assumption, not a sourced figure; check “How it works”.</p>',
  },
  bab: {
    one: 'The southern gate of the Red Sea, between Yemen and Djibouti.',
    lede: 'Every ship using the Suez Canal must also pass here. Houthi attacks since late 2023 have pushed much of the traffic round Africa.',
    stats: [
      ['Oil flow, 2023', '9.3 mb/d (EIA)'],
      ['Oil flow, 1H 2025', '4.2 mb/d (EIA) — less than half, after the attacks'],
      ['The detour', 'Round the Cape of Good Hope: about 15 extra days from the Arabian Sea to Europe (EIA)'],
      ['In 2026', 'The Houthis announced a blockade of Saudi shipping in late July 2026'],
    ],
    india: 'India’s exports to Europe — textiles, engineering goods, refined fuel — mostly sail through here. Longer voyages mean higher freight costs for exporters.',
    reality: '<p>A real test run happened in 2024: after Houthi attacks, oil flows through Bab-el-Mandeb fell by more than half and ships went round the Cape instead. Freight rates jumped far more than oil prices did — exactly the pattern the model shows.</p>',
  },
  suez: {
    one: 'The canal linking the Red Sea to the Mediterranean, plus a pipeline beside it.',
    lede: 'The SUMED pipeline (2.5 mb/d capacity) can carry crude across Egypt when tankers can’t use the canal.',
    stats: [
      ['Oil flow, 2023', '8.8 mb/d (EIA)'],
      ['Oil flow, 1H 2025', '4.9 mb/d (EIA)'],
      ['Canal revenue', '$10.2bn in 2023 → $4.1bn in 2025 (Suez Canal Authority, via news)'],
      ['In 2026', 'July revenue rose 42% on a year earlier as Saudi crude was rerouted to the Red Sea'],
    ],
    india: 'For India, Suez and Bab-el-Mandeb are one route: the main sea road to Europe.',
    reality: '<p>In March 2021 a single stuck container ship, the <i>Ever Given</i>, blocked the canal for six days. Hundreds of ships queued at both ends — a reminder that a chokepoint can close without any war at all.</p>',
  },
  panama: {
    one: 'The short cut between the Atlantic and the Pacific.',
    lede: 'A smaller oil route, but important for US exports of LNG, propane and grain to Asia.',
    stats: [
      ['Oil flow', '2.3 mb/d (EIA, fiscal year 2025)'],
      ['US LNG through the canal', 'From about 2.5 bcf/d (FY2021) to under 0.3 (FY2025)'],
      ['In 2026', 'In June, 50 of 54 US LNG cargoes to Asia went round the Cape instead (via news)'],
      ['Water', 'The canal runs on rain-fed lakes. In July 2026 it cut the maximum ship depth, citing a possible El Niño'],
    ],
    india: 'Little direct effect on India; the main losers would be US exporters and Asian buyers of US gas.',
    reality: '<p>A drought in 2023–24 forced the canal to cut daily crossings, and tankers queued or went round. It showed that a chokepoint can be squeezed by weather as well as by war.</p>',
  },
  cape: {
    one: 'Not a chokepoint — the long way round Africa when the Red Sea is unsafe.',
    lede: 'Ships use the Cape when Suez or Bab-el-Mandeb are too risky. It adds time and fuel, not a choke.',
    stats: [
      ['Oil flow, 2023', '6.2 mb/d (EIA)'],
      ['Oil flow, 1H 2025', '9.1 mb/d (EIA) — up as ships avoided the Red Sea'],
      ['Extra time', 'About 15 days from the Arabian Sea to Europe (EIA)'],
    ],
    india: 'When the Red Sea is closed, Indian cargo to Europe sails this way.',
    reality: '<p>The Cape is the safety valve: it’s why closing Bab-el-Mandeb or Suez raises freight costs far more than oil prices.</p>',
  },
};

// Numbered events for the price chart (dates are 2026)
window.CP_FACTS.events = [
  { date: '2026-02-28', short: 'US and Israeli strikes on Iran; ship traffic through Hormuz falls about 70% overnight' },
  { date: '2026-03-11', short: 'IEA countries agree a record 400-million-barrel release from emergency stocks' },
  { date: '2026-04-08', short: 'Two-week US–Iran ceasefire; oil’s biggest one-day fall since 2020' },
  { date: '2026-04-13', short: 'US blockade of ships going to or from Iranian ports begins; on 17 April Iran declares the strait open, then shuts it again the next day' },
  { date: '2026-06-17', short: 'Islamabad Memorandum signed: 60 days of free passage; the US lifts its blockade the next day' },
  { date: '2026-07-08', short: 'Memorandum collapses after Iran fires on ships; the US blockade returns on 14 July' },
  { date: '2026-09-09', short: 'Biggest wave of tanker attacks: the US says it sank five Iranian tankers, Iran says it hit 10 ships' },
  { date: '2026-10-04', short: 'Iran’s chief negotiator says the strait stays shut until the US meets its conditions' },
  { date: '2026-11-04', short: 'Doha talks and the US midterms; oil futures fall about 13% in a week on hopes of a deal' },
];

// Fuller timeline for the briefing page
window.CP_FACTS.timeline = [
  ['27 Feb', 'Last day before the war. Brent futures close at $72.48 as US–Iran talks falter.', 'Reuters'],
  ['28 Feb', 'The US and Israel strike Iran. Iran’s Revolutionary Guards radio ships that none may pass; traffic falls about 70% that night. Supreme Leader Ali Khamenei is reported killed.', 'Wikipedia, citing multiple outlets'],
  ['2–5 Mar', 'Iran confirms the closure. Qatar halts gas output after drone attacks and declares force majeure on LNG; ship insurers pull cover.', 'CNBC, Reuters'],
  ['8–9 Mar', 'Brent futures top $100 for the first time since 2022 and come close to $120 during trading.', 'CNBC'],
  ['11 Mar', 'IEA members agree a record 400-million-barrel release from emergency stocks.', 'gCaptain'],
  ['13 Mar', 'Saudi Arabia cuts output by a fifth to 8 mb/d. Iran starts letting selected ships through, including Indian gas carriers.', 'Wikipedia'],
  ['8 Apr', 'A two-week US–Iran ceasefire. Brent futures drop to $94.75, the biggest one-day fall since April 2020.', 'CNBC'],
  ['11–13 Apr', 'Talks in Islamabad end without a deal. The US blockade of ships travelling to or from Iranian ports takes effect.', 'Reuters'],
  ['17–18 Apr', 'Iran declares the strait open, about 13 tankers pass, then Iran shuts it again because the blockade stays. Indian ships are among those fired on.', 'CNBC, AP'],
  ['30 Apr', 'Brent futures hit about $126 during trading, the war’s peak.', 'CNBC'],
  ['4–6 May', 'US naval escorts (“Project Freedom”) start, then pause amid talk of progress.', 'CNN'],
  ['17–18 Jun', 'The Islamabad Memorandum is signed: 60 days of toll-free passage and a 60-day ceasefire. The US lifts its blockade.', 'Al Jazeera'],
  ['24 Jun', 'Brent futures close at $73.74 — almost back to their pre-war level.', 'CNBC'],
  ['7–14 Jul', 'Iran fires on ships including a Qatari LNG tanker; the US strikes back and declares the memorandum over. The blockade returns on 14 July.', 'Reuters, Anadolu'],
  ['21–23 Jul', 'Yemen’s Houthis declare a blockade of Saudi shipping in the Red Sea and claim attacks on two tankers.', 'Maritime Executive'],
  ['19 Aug', 'Iran’s central bank says its oil exports have fallen to effectively zero.', 'Anadolu'],
  ['9 Sep', 'The largest wave of attacks yet. US diesel hits a record above $5.94 a gallon.', 'gCaptain, Reuters'],
  ['14 Sep', 'The US Strategic Petroleum Reserve falls to its lowest level since 1982.', 'Reuters'],
  ['4 Oct', 'Iran’s chief negotiator says the strait stays shut until the US lifts the blockade and sanctions, frees frozen assets and stops attacks on Iran and its allies.', 'Qatar Tribune'],
  ['Oct', 'The IMO logs 29 attacks on merchant ships in three weeks, the most since March.', 'S&P Global'],
  ['30 Oct–6 Nov', 'Qatar-mediated talks in Doha. Oil futures fall about 13% in a week on hopes of a deal; Iran says US acceptance of its conditions is the “only way” to reopen.', 'Trading Economics, Tasnim'],
];

// Who wants what — neutral summaries, each side in its own terms
window.CP_FACTS.actors = [
  { name: 'Iran', wants: 'Recognition of its control over the strait; an end to sanctions and the blockade',
    says: 'Calls control of Hormuz a sovereign right and its main bargaining chip. Will reopen only if the US ends the blockade, lifts the oil-export ban and sanctions, releases frozen assets, and stops attacks on Iran and its allies.',
    leverage: 'Mines, drones and fast boats; it can choose which ships pass, and has let Chinese, Russian, Indian and Pakistani ships through at times.',
    cost: 'Its own oil exports fell to almost nothing by August. The US says no country may charge tolls on an international waterway.' },
  { name: 'United States', wants: 'An end to Iran’s nuclear and missile threat; ships moving again',
    says: 'Will not give in to Iran’s conditions first. Blockades ships going to and from Iranian ports (not the whole strait), clears mines and escorts tankers.',
    leverage: 'Naval power, sanctions and the threat of sanctions on Iran’s buyers.',
    cost: 'Petrol above $4 a gallon and the emergency oil reserve at a 44-year low. In one poll 64% of Americans said the war has not been worth it. Its recovery figures are often higher than independent tanker counts.' },
  { name: 'Israel', wants: 'An end to Iran’s nuclear programme and missile threat',
    says: 'Prime Minister Netanyahu has set out goals including ending enrichment and removing the missile threat, and denies pulling the US into the war.',
    leverage: 'No direct role at Hormuz, but the Lebanon front has been tied to every attempt to reopen the strait.',
    cost: 'Iran linked both its April reopening and its June re-closure to fighting in Lebanon; the US disputed that these were violations.' },
  { name: 'Saudi Arabia, the UAE, Oman and Qatar', wants: 'The strait reopened without rewarding coercion',
    says: 'Oman and Qatar have acted as go-betweens; Qatar hosted the autumn talks in Doha.',
    leverage: 'Pipelines that bypass the strait: Saudi Arabia’s to Yanbu on the Red Sea and the UAE’s to Fujairah.',
    cost: 'Saudi output cut from 10 to 8 mb/d; Gulf tankers struck; Qatar’s LNG exports halted and its Ras Laffan plant damaged.' },
  { name: 'China', wants: 'Oil flowing, without taking sides openly',
    says: 'Says unimpeded passage serves everyone, while backing Iran’s “sovereignty and security”. Vetoed a US-backed UN shipping resolution in April.',
    leverage: 'The biggest buyer of Iranian oil; its ships have been allowed through; large oil reserves.',
    cost: 'About a third of its oil and LNG imports normally come through Hormuz.' },
  { name: 'India', wants: 'Energy security and safe passage for Indian ships and sailors',
    says: 'Has called for a ceasefire without naming any side.',
    leverage: 'A big customer valued by both sides; the Indian Navy escorts Indian-flagged ships.',
    cost: 'Indian sailors killed and ships fired on; the Chabahar port project in limbo. The opposition Congress party calls the government’s stance “moral cowardice”; supporters call it strategic balance.' },
  { name: 'The Houthis (Yemen)', wants: 'Pressure on Israel, Saudi Arabia and the US',
    says: 'Resumed attacks on shipping when the war began and declared a blockade of Saudi shipping in July.',
    leverage: 'Bab-el-Mandeb, the Red Sea exit that Saudi Arabia’s bypass oil must also use.',
    cost: 'Some of their claimed attacks, such as on Ras Tanura in October, are unconfirmed.' },
  { name: 'Russia', wants: 'Higher oil revenue and sanctions relief',
    says: 'Has taken no public position on Hormuz; agreed with the US in October to release diesel.',
    leverage: 'An alternative supplier; the US waived sanctions on Russian oil already at sea in March.',
    cost: 'Chatham House calls the war an economic gift to Moscow, though Ukrainian strikes may have cut Russian exports.' },
];

// India vs US: what has actually happened
window.CP_FACTS.effects = [
  ['How exposed', 'About 52% of crude imports and 90% of LPG imports came through Hormuz in early 2026 (S&P Global, ORF)', 'About 7% of crude imports came through Hormuz (EIA)'],
  ['At the pump', 'Excise cut of ₹10 a litre in March, then the first price rise in about four years in May; Delhi petrol ₹102.12 on 8 Oct', 'Petrol about 50% above pre-war in May; $4.10 a gallon on 5 Nov (AAA)'],
  ['Prices and rates', 'Inflation 5.54% in September; RBI raised rates to 5.50% on 7 Oct, its first hike in over three years', 'Inflation 3.7% in September; the Fed held rates at 3.75–4.00% in October'],
  ['Money', 'Rupee near ₹97 to the dollar; foreign investors pulled out ₹3.08 trillion in Jan–Sep', 'Record crude exports, about 6.5 mb/d in April'],
  ['Shares', 'Nifty down about 14% for the year to mid-October', 'S&P 500 up about 13% for the year in late October'],
  ['Who got hurt', 'State fuel retailers losing about ₹530 crore a day in September; 400+ ceramic factories in Morbi shut for three weeks', 'Jet fuel up 95%; Spirit Airlines stopped flying on 2 May'],
  ['Cushion', 'About 74 days of cover including company stocks (9.5 days in the strategic reserve)', 'Strategic reserve at its lowest since 1982'],
];
