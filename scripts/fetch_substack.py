#!/usr/bin/env python3
"""
Fetch the latest posts from ashutoshdev.substack.com and write data/substack.json.

Run automatically by .github/workflows/substack-fetch.yml (daily) so the site
can render Substack posts without hitting CORS limits in the browser.
Uses only the Python standard library.
"""

import json
import re
import sys
import urllib.request
from pathlib import Path
from xml.etree import ElementTree

SUBSTACK_URL = "https://ashutoshdev.substack.com"
FEED_URL = f"{SUBSTACK_URL}/feed"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "substack.json"
MAX_POSTS = 12

NAMESPACES = {"content": "http://purl.org/rss/1.0/modules/content/"}


def fetch_feed(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (site feed sync)"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8", errors="replace")


def first_image(html: str) -> str:
    match = re.search(r'<img[^>]+src="([^"]+)"', html or "", re.IGNORECASE)
    return match.group(1) if match else ""


def strip_html(html: str) -> str:
    return re.sub(r"<[^>]+>", "", html or "").strip()


def parse_feed(xml_text: str) -> list:
    root = ElementTree.fromstring(xml_text)
    posts = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "Untitled").strip()
        link = (item.findtext("link") or SUBSTACK_URL).strip()
        pub_date = (item.findtext("pubDate") or "").strip()
        description = strip_html(item.findtext("description") or "")

        enclosure = item.find("enclosure")
        cover = enclosure.get("url", "") if enclosure is not None else ""
        if not cover:
            cover = first_image(item.findtext("content:encoded", default="", namespaces=NAMESPACES))

        posts.append({
            "title": title,
            "url": link,
            "date": pub_date,
            "subtitle": description[:280],
            "cover": cover,
        })
    return posts[:MAX_POSTS]


def main():
    print(f"Fetching {FEED_URL}")
    try:
        xml_text = fetch_feed(FEED_URL)
        posts = parse_feed(xml_text)
    except Exception as exc:
        print(f"ERROR: could not fetch/parse feed: {exc}")
        # Keep any previously fetched file rather than clobbering it.
        sys.exit(0 if OUTPUT_FILE.exists() else 1)

    if not posts:
        print("Feed returned no posts; keeping existing file.")
        sys.exit(0)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(posts)} posts to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
