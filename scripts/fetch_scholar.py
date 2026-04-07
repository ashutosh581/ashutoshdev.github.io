#!/usr/bin/env python3
"""
Fetch publications for Ashutosh Dev from Google Scholar and write to publications.json.

Usage:
    pip install scholarly
    python scripts/fetch_scholar.py

This script is run automatically by .github/workflows/scholar-fetch.yml every Monday.
To add new publications manually, edit publications.json directly — they will be
preserved across automated runs (the script only adds new entries, never removes).
Existing entries also have their citation counts refreshed on each run.

Configuration:
    SCHOLAR_ID is the Google Scholar profile ID from the profile URL:
    https://scholar.google.com/citations?user=attWSMsAAAAJ
"""

import json
import sys
import time
from pathlib import Path

try:
    from scholarly import scholarly, ProxyGenerator
except ImportError:
    print("ERROR: scholarly not installed. Run: pip install scholarly")
    sys.exit(1)

# ── Configuration ──────────────────────────────────────────────────────────────
# Google Scholar profile ID:
# https://scholar.google.com/citations?user=attWSMsAAAAJ
SCHOLAR_ID = "attWSMsAAAAJ"
SCHOLAR_NAME = "Ashutosh Dev"
OUTPUT_FILE = Path(__file__).parent.parent / "publications.json"
MAX_RETRIES = 3
RETRY_DELAY = 10  # seconds between retries
# ──────────────────────────────────────────────────────────────────────────────


def setup_proxy():
    """Try to configure a free proxy to avoid Google bot detection."""
    try:
        pg = ProxyGenerator()
        success = pg.FreeProxies()
        if success:
            scholarly.use_proxy(pg)
            print("Using free proxy for Scholar requests.")
        else:
            print("No free proxy available; attempting direct connection.")
    except Exception as exc:
        print(f"Proxy setup skipped: {exc}")


def fetch_by_id(scholar_id: str) -> list:
    """Fetch all publications for a given Google Scholar author ID."""
    print(f"Fetching by Scholar ID: {scholar_id}")
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            author = scholarly.search_author_id(scholar_id)
            scholarly.fill(author, sections=["publications"])
            pubs = author.get("publications", [])
            print(f"  Found {len(pubs)} publications.")
            return pubs
        except Exception as exc:
            print(f"  Attempt {attempt}/{MAX_RETRIES} failed: {exc}")
            if attempt < MAX_RETRIES:
                # Exponential backoff: 10s, 20s, 40s for attempts 1, 2, 3
                time.sleep(RETRY_DELAY * (2 ** (attempt - 1)))
    return []


def fetch_by_name(name: str) -> list:
    """Fetch publications for the first Scholar profile matching name."""
    print(f"Fetching by author name: {name}")
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            results = scholarly.search_author(name)
            author = next(results, None)
            if author is None:
                print(f"No Scholar profile found for: {name}")
                return []
            scholarly.fill(author, sections=["publications"])
            pubs = author.get("publications", [])
            print(f"  Found {len(pubs)} publications.")
            return pubs
        except Exception as exc:
            print(f"  Attempt {attempt}/{MAX_RETRIES} failed: {exc}")
            if attempt < MAX_RETRIES:
                # Exponential backoff: 10s, 20s, 40s for attempts 1, 2, 3
                time.sleep(RETRY_DELAY * (2 ** (attempt - 1)))
    return []


def normalise(pub: dict) -> dict:
    """Normalise a raw scholarly publication dict into our JSON schema."""
    bib = pub.get("bib", {})
    raw_url = pub.get("pub_url", "") or ""
    url = raw_url if raw_url.startswith("http") else (
        f"https://doi.org/{raw_url}" if raw_url else ""
    )
    return {
        "title": bib.get("title", ""),
        "journal": bib.get("journal", bib.get("venue", bib.get("conference", ""))),
        "year": bib.get("pub_year", ""),
        "authors": bib.get("author", ""),
        "doi": "",
        "url": url,
        "thumbnail": "",
        "citations": pub.get("num_citations", 0),
    }


def load_existing() -> list:
    """Load the current publications.json, returning [] if it doesn't exist."""
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, encoding="utf-8") as f:
            return json.load(f)
    return []


def merge(existing: list, fetched: list) -> list:
    """
    Merge newly-fetched publications into the existing list.
    Existing entries (including manually-added ones) are always preserved.
    New entries from Scholar are appended only if their title is not already present.
    Citation counts are updated for existing entries that match by title.
    """
    # Build lookup by normalised title for citation updates
    fetched_by_title = {
        p["title"].strip().lower(): p for p in fetched if p.get("title")
    }

    result = []
    updated = 0
    for entry in existing:
        key = (entry.get("title") or "").strip().lower()
        if key in fetched_by_title:
            new_citations = fetched_by_title[key].get("citations", 0)
            if entry.get("citations") != new_citations:
                entry = dict(entry)
                entry["citations"] = new_citations
                updated += 1
            # Remove from fetched so we don't double-add
            del fetched_by_title[key]
        result.append(entry)

    added = 0
    for pub in fetched_by_title.values():
        if pub.get("title"):
            result.append(pub)
            added += 1

    print(f"Added {added} new, updated citations for {updated} existing (total: {len(result)})")
    return result


def main():
    print("=== Google Scholar Publication Fetcher ===")
    print(f"Scholar ID: {SCHOLAR_ID}")

    setup_proxy()

    raw = []
    try:
        if SCHOLAR_ID:
            raw = fetch_by_id(SCHOLAR_ID)
        else:
            raw = fetch_by_name(SCHOLAR_NAME)
    except Exception as exc:
        print(f"Warning: Could not fetch from Google Scholar: {exc}")
        print("Keeping existing publications.json unchanged.")

    if not raw:
        print("No publications fetched. Exiting without changes.")
        sys.exit(0)

    fetched = [normalise(p) for p in raw if p.get("bib", {}).get("title")]
    existing = load_existing()
    merged = merge(existing, fetched)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    print(f"Written {len(merged)} publications to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
