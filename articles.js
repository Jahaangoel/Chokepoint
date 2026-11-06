/* Chokepoint — articles (Read more). Articles live in /articles as Markdown files. */
window.CPArticles = (function () {
  const C = window.CP;
  async function all() {
    try {
      const list = await C.json('articles/articles.json');
      return list.filter(a => !a.hidden).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } catch (e) { return []; }
  }
  function item(a) {
    return `<li><span class="d">${a.date ? C.fmtDate(a.date) : ''}${a.tag ? '<br>' + C.esc(a.tag) : ''}</span><a href="article.html?a=${encodeURIComponent(a.slug)}">${C.esc(a.title)}</a>${a.dek ? `<p>${C.esc(a.dek)}</p>` : ''}</li>`;
  }
  async function list(el, n) {
    let a = await all();
    if (n) a = a.slice(0, n);
    el.innerHTML = a.length ? a.map(item).join('') : '<li><span class="d"></span><p style="grid-column:1/-1;margin:0">Articles are on their way.</p></li>';
  }
  async function page(el) {
    const slug = new URLSearchParams(location.search).get('a');
    const a = (await all()).find(x => x.slug === slug);
    if (!a) { el.innerHTML = '<h1 class="h-page">Article not found</h1><p><a href="read.html">See all articles</a></p>'; return; }
    document.title = a.title + ' — Chokepoint';
    const md = await fetch('articles/' + encodeURIComponent(a.slug) + '.md', { cache: 'no-cache' }).then(r => r.ok ? r.text() : '');
    const body = window.marked ? marked.parse(md.replace(/^---[\s\S]*?---\s*/, '')) : '<pre>' + C.esc(md) + '</pre>';
    const words = md.split(/\s+/).length;
    el.innerHTML = `<article>
<header style="max-width:var(--measure);padding:36px 0 24px;border-bottom:1px solid var(--rule)">
  ${a.tag ? `<p class="kicker">${C.esc(a.tag)}</p>` : ''}
  <h1 class="h-page">${C.esc(a.title)}</h1>
  ${a.dek ? `<p class="dek">${C.esc(a.dek)}</p>` : ''}
  <p class="byline">By ${C.esc(a.author || 'Jahaan')}${a.date ? ' · ' + C.fmtDate(a.date, { day: 'numeric', month: 'long', year: 'numeric' }) : ''} · ${Math.max(1, Math.round(words / 230))} min read${a.publication ? ' · First published in ' + C.esc(a.publication) : ''}</p>
</header>
<div class="prose dropcap" style="padding-top:28px">${body}</div>
<p style="margin-top:36px"><a href="read.html">← All articles</a></p>
</article>`;
  }
  return { all, list, page };
})();
