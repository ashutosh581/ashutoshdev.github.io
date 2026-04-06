#!/usr/bin/env python3
"""
Fetch publications for Ashutosh Dev from Google Scholar and write to publications.json.

Usage:
    pip install scholarly
    python scripts/fetch_scholar.py

This script is run automatically by .github/workflows/scholar-fetch.yml every Monday.
To add new publications manually, edit publications.json directly — they will be
preserved across automated runs (the script only adds new entries, never removes).

Configuration:
    Set SCHOLAR_ID to your Google Scholar profile ID (found in the URL of your
    Scholar profile page: scholar.google.com/citations?user=<SCHOLAR_ID>).
    Leave as empty string "" to fall back to name-based search.
"""

import json
import sys
from pathlib import Path

try:
    from scholarly import scholarly
except ImportError:
    print("ERROR: scholarly not installed. Run: pip install scholarly")
    sys.exit(1)

# ── Configuration ──────────────────────────────────────────────────────────────
# TODO: Replace with your actual Google Scholar ID.
# Find it at: https://scholar.google.com/citations?user=<YOUR_ID>
SCHOLAR_ID = ""
SCHOLAR_NAME = "Ashutosh Dev"
OUTPUT_FILE = Path(__file__).parent.parent / "publications.json"
# ──────────────────────────────────────────────────────────────────────────────


def fetch_by_id(scholar_id: str) -> list:
    """Fetch all publications for a given Google Scholar author ID."""
    print(f"Fetching by Scholar ID: {scholar_id}")
    author = scholarly.search_author_id(scholar_id)
    scholarly.fill(author, sections=["publications"])
    return author.get("publications", [])


def fetch_by_name(name: str) -> list:
    """Fetch publications for the first Scholar profile matching name."""
    print(f"Fetching by author name: {name}")
    results = scholarly.search_author(name)
    author = next(results, None)
    if author is None:
        print(f"No Scholar profile found for: {name}")
        return []
    scholarly.fill(author, sections=["publications"])
    return author.get("publications", [])


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
    New entries from Scholar are appended only if their URL is not already present.
    """
    existing_urls = {p.get("url", "") for p in existing if p.get("url")}
    result = list(existing)
    added = 0
    for pub in fetched:
        if pub.get("title") and pub.get("url") not in existing_urls:
            result.append(pub)
            existing_urls.add(pub.get("url", ""))
            added += 1
    print(f"Merged {added} new publications (total: {len(result)})")
    return result


def main():
    print("=== Google Scholar Publication Fetcher ===")

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
        print("No new publications fetched. Exiting without changes.")
        return

    fetched = [normalise(p) for p in raw if p.get("bib", {}).get("title")]
    existing = load_existing()
    merged = merge(existing, fetched)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    print(f"Written {len(merged)} publications to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
