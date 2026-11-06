"""
Chokepoint nightly data update.

Downloads prices for every stock in scripts/universe.csv plus Brent, the Nifty 50,
the S&P 500 and USD/INR, then measures how each stock moves with oil.

Method (explained in plain English on method.html):
  * Weekly (Friday-to-Friday) log returns, last 156 weeks ("normal times").
  * Model A  r_stock = a + b_mkt * r_market + b_oil * r_brent   -> oil effect after
             removing the market's own move ("direct sensitivity").
  * Model B  r_stock = c + B * r_brent                           -> total move that
             usually comes with an oil move ("scenario sensitivity").
  * Crisis window (since the war began, 2 Mar 2026): daily returns with a one-day
    lag on oil, B_crisis = coef(oil today) + coef(oil yesterday). The lag handles
    Indian markets closing before oil settles.
  * Newey-West (HAC) standard errors; 95% intervals.
  * Noisy estimates are pulled toward their sector average (shrinkage).

If anything fails, the previous data/stocks.json is kept and marked stale.
"""
from __future__ import annotations

import csv
import json
import math
import os
import sys
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
UNIVERSE = os.path.join(ROOT, "scripts", "universe.csv")
OUT_STOCKS = os.path.join(DATA, "stocks.json")
OUT_MARKET = os.path.join(DATA, "market.json")
OUT_BRENT = os.path.join(DATA, "brent.json")

BRENT = "BZ=F"
NIFTY = "^NSEI"
SPX = "^GSPC"
USDINR = "INR=X"
WAR_START = "2026-02-27"      # last trading day before the strikes (baseline for "since the war")
CRISIS_START = "2026-03-02"   # first trading day of the crisis
BASE_WEEKS = 156
MIN_WEEKS = 104
MIN_CRISIS_DAYS = 60
SCORE_SHOCK = 0.50            # risk score uses Brent +50%


# ---------------------------------------------------------------- utilities
def hac_maxlags(n: int) -> int:
    return max(1, int(math.floor(4 * (n / 100.0) ** (2.0 / 9.0))))


def ols_hac(y: np.ndarray, X: np.ndarray, maxlags: int):
    """OLS with Newey-West standard errors. X must include a constant column."""
    n, k = X.shape
    XtX_inv = np.linalg.pinv(X.T @ X)
    beta = XtX_inv @ X.T @ y
    resid = y - X @ beta
    # Newey-West meat
    Xu = X * resid[:, None]
    S = Xu.T @ Xu
    for lag in range(1, maxlags + 1):
        w = 1.0 - lag / (maxlags + 1.0)
        G = Xu[lag:].T @ Xu[:-lag]
        S += w * (G + G.T)
    cov = XtX_inv @ S @ XtX_inv * (n / max(n - k, 1))
    ss_tot = float(((y - y.mean()) ** 2).sum())
    r2 = 1.0 - float((resid ** 2).sum()) / ss_tot if ss_tot > 0 else float("nan")
    return beta, cov, r2


def weekly_log_returns(px: pd.Series) -> pd.Series:
    w = px.resample("W-FRI").last()
    return np.log(w).diff()


def r(x, d=4):
    if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))):
        return None
    return round(float(x), d)


# ---------------------------------------------------------------- download
def download(tickers: list[str]) -> pd.DataFrame:
    import yfinance as yf

    last_err = None
    for attempt in range(4):
        try:
            df = yf.download(
                tickers, period="4y", interval="1d", auto_adjust=True,
                group_by="column", threads=True, progress=False,
                multi_level_index=True, timeout=30,
            )
            closes = df["Close"] if isinstance(df.columns, pd.MultiIndex) else df[["Close"]]
            closes = closes.dropna(how="all")
            if closes.shape[0] > 200:
                return closes
            last_err = RuntimeError("too few rows returned")
        except Exception as e:  # rate limits etc.
            last_err = e
        wait = 20 * (2 ** attempt)
        print(f"download attempt {attempt + 1} failed: {last_err}; retrying in {wait}s", file=sys.stderr)
        time.sleep(wait)
    raise RuntimeError(f"download failed: {last_err}")


# ---------------------------------------------------------------- estimation
def estimate(closes: pd.DataFrame, universe: list[dict]) -> dict:
    closes = closes.sort_index()
    closes.index = pd.to_datetime(closes.index).tz_localize(None)
    brent = closes[BRENT].dropna()
    out = []

    wk_brent = weekly_log_returns(brent)
    d_brent = np.log(brent).diff()

    for row in universe:
        t = row["ticker"]
        rec = {k: row[k] for k in ("ticker", "name", "market", "list", "sector", "note")}
        rec["flags"] = []
        if t not in closes.columns or closes[t].dropna().shape[0] < 30:
            rec["flags"].append("no-data")
            out.append(rec)
            continue
        px = closes[t].dropna()
        mkt = closes[NIFTY if row["market"] == "IN" else SPX].dropna()
        rec["price"] = r(px.iloc[-1], 2)
        rec["currency"] = "INR" if row["market"] == "IN" else "USD"
        pre = px[:WAR_START]
        if len(pre):
            rec["chg_war"] = r(px.iloc[-1] / pre.iloc[-1] - 1)
        # small weekly series since 1 Jan 2026 for sparklines (indexed to 100 at war start)
        wk = px["2026-01-01":].resample("W-FRI").last().dropna()
        if len(pre):
            rec["spark"] = [r(v / pre.iloc[-1] * 100, 1) for v in wk.values]

        # ---- baseline window, weekly
        df = pd.concat({"y": weekly_log_returns(px), "m": weekly_log_returns(mkt), "o": wk_brent}, axis=1).dropna()
        df = df.iloc[-BASE_WEEKS:]
        rec["n_weeks"] = int(len(df))
        if len(df) >= MIN_WEEKS:
            L = hac_maxlags(len(df))
            y = df["y"].values
            XA = np.column_stack([np.ones(len(df)), df["m"].values, df["o"].values])
            bA, cA, r2A = ols_hac(y, XA, L)
            XB = np.column_stack([np.ones(len(df)), df["o"].values])
            bB, cB, r2B = ols_hac(y, XB, L)
            rec.update(
                b_mkt=r(bA[1]), b_oil=r(bA[2]), b_oil_se=r(math.sqrt(cA[2, 2])), r2_a=r(r2A, 3),
                B_base=r(bB[1]), B_base_se=r(math.sqrt(cB[1, 1])), r2_b=r(r2B, 3),
            )
        else:
            rec["flags"].append("short-history")

        # ---- crisis window, daily with one lag on oil
        dd = pd.concat({"y": np.log(px).diff(), "o": d_brent}, axis=1)
        dd["o1"] = dd["o"].shift(1)
        dd = dd[CRISIS_START:].dropna()
        # drop zero-return days (holidays/stale prints) on the stock
        dd = dd[dd["y"] != 0]
        rec["n_days"] = int(len(dd))
        if len(dd) >= MIN_CRISIS_DAYS:
            L = hac_maxlags(len(dd))
            X = np.column_stack([np.ones(len(dd)), dd["o"].values, dd["o1"].values])
            b, c, r2 = ols_hac(dd["y"].values, X, L)
            Bc = b[1] + b[2]
            var = c[1, 1] + c[2, 2] + 2 * c[1, 2]
            rec.update(B_crisis=r(Bc), B_crisis_se=r(math.sqrt(max(var, 0))), r2_c=r(r2, 3))
        else:
            rec["flags"].append("short-crisis")
        out.append(rec)

    # ---- shrink toward sector mean
    for key in ("B_base", "B_crisis"):
        se_key = key + "_se"
        by_sector: dict[str, list[dict]] = {}
        for rec in out:
            if rec.get(key) is not None:
                by_sector.setdefault(rec["sector"], []).append(rec)
        all_vals = [x[key] for x in out if x.get(key) is not None]
        all_se2 = [x[se_key] ** 2 for x in out if x.get(key) is not None]
        g_tau2 = max(float(np.var(all_vals)) - float(np.mean(all_se2)), 1e-4) if all_vals else 1e-2
        for sector, recs in by_sector.items():
            vals = np.array([x[key] for x in recs])
            se2 = np.array([x[se_key] ** 2 for x in recs])
            mean = float(vals.mean()) if len(vals) >= 3 else float(np.mean(all_vals))
            tau2 = max(float(vals.var()) - float(se2.mean()), 1e-4) if len(vals) >= 3 else g_tau2
            for x, s2 in zip(recs, se2):
                w = tau2 / (tau2 + s2)
                x[key + "_s"] = r(w * x[key] + (1 - w) * mean)
                x[key + "_w"] = r(w, 3)
            # sector means are published for the method page
    sectors = {}
    for rec in out:
        s = sectors.setdefault(rec["sector"], {"n": 0, "B_crisis": [], "B_base": []})
        s["n"] += 1
        for key in ("B_crisis", "B_base"):
            if rec.get(key) is not None:
                s[key].append(rec[key])
    sectors = {k: {"n": v["n"], "B_crisis_mean": r(np.mean(v["B_crisis"])) if v["B_crisis"] else None,
                   "B_base_mean": r(np.mean(v["B_base"])) if v["B_base"] else None} for k, v in sectors.items()}

    # ---- "adverse" sensitivity used by the risk score: the more negative of the two shrunk estimates
    for rec in out:
        vals = [rec.get("B_base_s"), rec.get("B_crisis_s")]
        vals = [v for v in vals if v is not None]
        rec["B_adverse"] = r(min(vals)) if vals else None

    def chg(t):
        s = closes[t].dropna()
        pre = s[:WAR_START]
        return r(s.iloc[-1] / pre.iloc[-1] - 1) if len(pre) else None

    market = {
        "asof": closes.index[-1].strftime("%Y-%m-%d"),
        "brent_futures": {"last": r(brent.iloc[-1], 2), "date": brent.index[-1].strftime("%Y-%m-%d"), "chg_war": chg(BRENT),
                          "pre_war": r(brent[:WAR_START].iloc[-1], 2)},
        "nifty": {"last": r(closes[NIFTY].dropna().iloc[-1], 1), "chg_war": chg(NIFTY)},
        "spx": {"last": r(closes[SPX].dropna().iloc[-1], 1), "chg_war": chg(SPX)},
        "usdinr": {"last": r(closes[USDINR].dropna().iloc[-1], 2), "chg_war": chg(USDINR)},
    }
    return {"stocks": out, "sectors": sectors, "market": market}


# ---------------------------------------------------------------- EIA spot Brent (no key needed)
def update_eia_brent():
    url = "https://raw.githubusercontent.com/datasets/oil-prices/main/data/brent-daily.csv"
    df = pd.read_csv(url)
    df = df[df["Date"] >= "2023-01-01"]
    series = [[d, round(float(p), 2)] for d, p in zip(df["Date"], df["Price"])]
    if len(series) < 500:
        raise RuntimeError("EIA series too short")
    with open(OUT_BRENT, "w") as f:
        json.dump({"source": "U.S. Energy Information Administration, Europe Brent Spot Price FOB (via github.com/datasets/oil-prices)",
                   "unit": "USD per barrel", "series": series}, f, separators=(",", ":"))


def load_universe():
    with open(UNIVERSE, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def mark_stale(path, reason):
    if not os.path.exists(path):
        return
    with open(path) as f:
        data = json.load(f)
    data["stale"] = True
    data["stale_reason"] = reason
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))


def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        update_eia_brent()
        print("EIA Brent updated")
    except Exception as e:
        print(f"EIA Brent update failed, keeping old file: {e}", file=sys.stderr)

    universe = load_universe()
    tickers = [u["ticker"] for u in universe] + [BRENT, NIFTY, SPX, USDINR]
    try:
        closes = download(tickers)
        result = estimate(closes, universe)
    except Exception as e:
        print(f"update failed: {e}", file=sys.stderr)
        mark_stale(OUT_STOCKS, str(e))
        return 0  # keep the site working with the last good data

    ok = sum(1 for s in result["stocks"] if s.get("B_crisis") is not None or s.get("B_base") is not None)
    if ok < 0.6 * len(universe):
        print(f"only {ok} stocks estimated; keeping previous data", file=sys.stderr)
        mark_stale(OUT_STOCKS, f"only {ok} of {len(universe)} stocks estimated")
        return 0

    payload = {
        "updated": now,
        "demo": False,
        "stale": False,
        "method": {
            "returns": "weekly log returns (Friday close), last 156 weeks; crisis: daily since 2 Mar 2026 with 1-day oil lag",
            "oil": BRENT, "markets": {"IN": NIFTY, "US": SPX},
            "se": "Newey-West (HAC)", "shrinkage": "toward sector mean, w = tau^2/(tau^2+SE^2)",
            "score_shock": SCORE_SHOCK,
        },
        "sectors": result["sectors"],
        "stocks": result["stocks"],
    }
    with open(OUT_STOCKS, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
    with open(OUT_MARKET, "w") as f:
        json.dump(dict(result["market"], updated=now), f, separators=(",", ":"))
    print(f"wrote {ok} estimates")
    return 0


if __name__ == "__main__":
    sys.exit(main())
