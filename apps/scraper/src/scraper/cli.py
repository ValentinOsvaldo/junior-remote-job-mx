"""`pnpm scrape` -> scrape entry-level dev jobs in Mexico with jobspy and write jobs.json."""

import argparse
import hashlib
import json
import logging
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from jobspy import scrape_jobs

from scraper import classify as c

log = logging.getLogger("scraper")

DEFAULT_OUT = Path(__file__).resolve().parents[3] / "web" / "public" / "data" / "jobs.json"
SITES = ["indeed", "linkedin", "glassdoor"]  # google returns nothing for MX queries
SEARCH_TERMS = [
    "desarrollador junior", "programador junior", "developer junior", "software engineer junior",
    "frontend junior", "backend junior", "full stack junior", "desarrollador movil junior",
    "android junior", "ios junior", "qa tester junior", "data engineer junior",
    "trainee desarrollador", "trainee developer", "becario desarrollo de software",
    "practicante programador", "software engineer intern",
]
KEEP_DAYS = 30
RAW_CACHE = Path(__file__).resolve().parents[2] / ".cache" / "raw.json"  # last scrape, for --from-cache


def fetch(term: str, sites: list[str], results: int, hours: int, descriptions: bool) -> list[dict]:
    try:
        df = scrape_jobs(
            site_name=sites, search_term=term, location="Mexico", country_indeed="mexico",
            results_wanted=results, hours_old=hours, verbose=0,
            linkedin_fetch_description=descriptions, fetch_description=descriptions,
        )
    except Exception as e:  # one failing term/site must not kill the whole run
        log.warning("  %s failed: %s", term, e)
        return []
    return df.astype(object).where(df.notna(), None).to_dict("records")


def to_job(row: dict, now: str) -> dict | None:
    title, desc = row.get("title") or "", row.get("description") or ""
    if not c.is_dev(title):
        return None
    level = c.seniority(title, desc, row.get("job_level") or "")
    if level is None:
        return None
    loc = row.get("location") or ""
    if loc and "mex" not in c.fold(loc) and c.location(loc)[1] is None:
        return None  # outside Mexico
    city, state = c.location(loc)
    company = row.get("company") or "Confidencial"
    key = f"{c.company_key(company)}|{re.sub(r'\W+', ' ', c.fold(title)).strip()}"  # same posting on several sites -> one id
    posted = row.get("date_posted")
    return {
        "id": hashlib.sha1(key.encode()).hexdigest()[:12],
        "title": title.strip(),
        "company": company.strip(),
        "level": level,
        "categories": c.categories(title),
        "stack": c.stack(title, desc),
        "modality": c.modality(row.get("is_remote"), title, loc, desc[:600]),
        "city": city,
        "state": state,
        "salaryMin": c.monthly_mxn(row.get("min_amount"), row.get("interval"), row.get("currency")),
        "salaryMax": c.monthly_mxn(row.get("max_amount"), row.get("interval"), row.get("currency")),
        "summary": c.summary(desc),
        "source": row["site"],
        "url": row.get("job_url_direct") or row["job_url"],
        "postedAt": posted.isoformat() if isinstance(posted, date) else (posted or now[:10]),
        "firstSeen": now,
    }


def combine(a: dict, b: dict) -> dict:
    """Same job seen twice: keep `a`, fill its gaps (salary, city, summary...) from `b`."""
    out = {**a, **{k: v for k, v in b.items() if not a.get(k) and v}}
    out["stack"] = sorted(set(a["stack"]) | set(b["stack"]))
    out["firstSeen"] = min(a["firstSeen"], b["firstSeen"])
    return out


def merge(old: list[dict], new: list[dict], now: str) -> list[dict]:
    """Merge with earlier runs and drop jobs older than KEEP_DAYS."""
    by_id = {j["id"]: j for j in old}
    for job in new:
        by_id[job["id"]] = combine(job, by_id[job["id"]]) if job["id"] in by_id else job
    cutoff = (datetime.fromisoformat(now) - timedelta(days=KEEP_DAYS)).date().isoformat()
    jobs = [j for j in by_id.values() if j["postedAt"] >= cutoff]
    return sorted(jobs, key=lambda j: j["postedAt"], reverse=True)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--sites", nargs="+", default=SITES, choices=["indeed", "linkedin", "glassdoor", "google"])
    p.add_argument("--results", type=int, default=40, help="results per site per search term")
    p.add_argument("--hours", type=int, default=24 * KEEP_DAYS, help="only jobs posted in the last N hours")
    p.add_argument("--terms", nargs="+", default=SEARCH_TERMS)
    p.add_argument("--out", type=Path, default=DEFAULT_OUT)
    p.add_argument("--fresh", action="store_true", help="ignore the existing jobs.json")
    p.add_argument("--fast", action="store_true", help="skip per-job description requests (no summaries)")
    p.add_argument("--from-cache", action="store_true", help="re-classify the last scrape without hitting the sites")
    args = p.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    if args.from_cache:
        batches = json.loads(RAW_CACHE.read_text(encoding="utf-8"))
    else:
        batches = {}
        for i, term in enumerate(args.terms, 1):
            batches[term] = fetch(term, args.sites, args.results, args.hours, not args.fast)
            log.info("[%2d/%d] %-32s %3d raw", i, len(args.terms), term, len(batches[term]))
        RAW_CACHE.parent.mkdir(exist_ok=True)
        RAW_CACHE.write_text(json.dumps(batches, ensure_ascii=False, default=str), encoding="utf-8")

    found: dict[str, dict] = {}
    raw = 0
    for rows in batches.values():
        raw += len(rows)
        for j in filter(None, (to_job(r, now) for r in rows)):
            found[j["id"]] = combine(found[j["id"]], j) if j["id"] in found else j

    old = []
    if args.out.exists() and not args.fresh:
        old = json.loads(args.out.read_text(encoding="utf-8"))["jobs"]
    jobs = merge(old, list(found.values()), now)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    payload = {"generatedAt": now, "count": len(jobs), "jobs": jobs}
    args.out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log.info("\n%d raw rows -> %d new matches -> %d jobs in %s", raw, len(found), len(jobs), args.out)


if __name__ == "__main__":
    main()
