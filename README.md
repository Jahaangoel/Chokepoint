# Chokepoint

An interactive atlas of the world's oil chokepoints, built around the 2026 Strait of Hormuz crisis.

**Made by Jahaan.** An educational model, not investment advice.

## Put it online with GitHub Pages (about 10 minutes)

1. On GitHub, create a new **public** repository called `chokepoint`.
2. Upload everything in this folder: **Add file → Upload files**, then drag in the contents of the folder, including the hidden `.github` folder. If your computer hides it, upload the rest first, then create the file `.github/workflows/update-data.yml` with **Add file → Create new file** and paste in its contents.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. Go to **Settings → Actions → General → Workflow permissions**, choose **Read and write permissions**, and save. This lets the nightly update save new data.
5. Go to the **Actions** tab, click **Update market data**, then **Run workflow**. It takes 2–4 minutes. When it finishes with a green tick, the demo numbers are replaced with real ones.
6. Your site is at `https://<your-username>.github.io/chokepoint/`.

After that, the data updates by itself every weekday morning (India time).

If the update ever fails (Yahoo Finance sometimes blocks automated downloads), the site keeps the last good numbers and shows a note saying they may be out of date. Run the workflow again later.

## Add an article

1. Write it as a `.md` file in the `articles` folder, for example `articles/why-hormuz-matters.md`.
2. Add an entry to `articles/articles.json`:

```json
{
  "slug": "why-hormuz-matters",
  "title": "Why Hormuz matters more to India than to America",
  "dek": "One sentence that sums up the piece.",
  "date": "2026-11-10",
  "author": "Jahaan",
  "tag": "Politics",
  "publication": "The Econocrat"
}
```

Remember the commas between entries. Delete the sample entry (`sample-layout`) when your first article is up.

## Present it

- Press **P** on any page for presenter mode (bigger, cleaner layout). Press P again to leave.
- On the simulator, the **up and down arrow keys** step through the straits.

## What's where

| File | What it does |
|---|---|
| `index.html` | Front page: the map and the price chart |
| `simulate.html` | Close a strait and see the knock-on effects |
| `portfolio.html` | Risk score for your own stocks, and the share card |
| `briefing.html` | The crisis explained: timeline, each side's position, India vs the US |
| `read.html`, `article.html` | Your articles |
| `method.html` | Formulas, data and sources |
| `assets/js/facts.js` | Every fact, date and source on the site, in one file you can edit |
| `assets/js/model.js` | The scenario model's numbers |
| `scripts/update_data.py` | The nightly calculation of each stock's sensitivity to oil |
| `scripts/universe.csv` | The list of stocks covered; add or remove rows here |
| `data/` | Prices and results (written by the nightly update) |

## Checking the facts before you present

The research report that went with this site lists where sources disagree. Two things are worth re-checking on the day you present:

- **The latest news:** talks were still going on in Doha in early November 2026.
- **Ticker symbols:** `TMPV.NS`, `TMCV.NS` and `SCI.NS` were not tested live. If the update can't find one, it shows "No data" for that stock and carries on.
