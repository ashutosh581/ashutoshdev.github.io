# How to update this website

Everything on the site is driven by simple data files — you never need to
touch HTML to add content. Edit the files below directly on GitHub
(open the file → pencil icon → commit), and the site updates automatically
within a minute or two of the commit.

**Automatic (nothing to do):** the publication list (BibBase renders your
Zotero collection live), the publication/citation stats (weekly GitHub
Action from Google Scholar), and Substack posts (daily GitHub Action).
**Manual (edit a JSON file / upload a file):** consulting reports, op-eds
and articles, photos, CV.

---

## 1. Add a consulting report / project

Edit **`data/consulting.json`** and add a new object to the array:

```json
{
  "title": "Report title",
  "client": "Client or programme name",
  "date": "2025-06-01",
  "description": "One or two sentences about the work.",
  "image": "assets/consulting/my-report-cover.png",
  "link": "assets/consulting/my-report.pdf",
  "tags": ["Carbon Finance", "Nepal"]
}
```

- Upload the PDF and a cover image to **`assets/consulting/`**
  (GitHub → `assets/consulting` folder → *Add file → Upload files*).
- `link` can also be an external `https://…` URL instead of a PDF.
- Leave `link` as `""` to show "Material coming soon".

## 2. Add an op-ed / article

Edit **`data/articles.json`**:

```json
{
  "title": "Article headline",
  "category": "climate",
  "outlet": "Nagarik Daily",
  "date": "2025-03-12",
  "language": "Nepali",
  "url": "https://link-to-the-article",
  "image": "assets/articles/clipping.jpg"
}
```

- `category` must be one of: **`climate`**, **`energy`**, **`politics`**, **`creative`**.
  The article automatically appears on the homepage filter AND on its
  topic archive page (`writing/climate/`, `writing/energy/`, etc.).
- Upload clippings/photos to **`assets/articles/`**.
- Add `"featured": true` and a `"quote": "…"` to one article to make it the
  highlighted feature at the top of the writing section.
- Delete the entries marked `"_sample": true` once you add real ones —
  sample entries are excluded from the stats counters.

## 3. Update publications

The visible publication list is rendered by **BibBase** directly from your
**Zotero** collection (user `18423835`, collection `NDPBJ35N`):

- **To add a paper:** add it to that Zotero collection — the site updates
  itself, no commit needed.
- The **stats strip** (publication + citation counts) comes from
  `publications.json`, auto-updated weekly (Mondays 02:00 UTC) from Google
  Scholar by `.github/workflows/scholar-fetch.yml`. You can edit it
  manually to fix metadata; manual edits are preserved by the Action.

## 4. Substack

Nothing to do — `.github/workflows/substack-fetch.yml` pulls your latest
posts from `ashutoshdev.substack.com` every day at 03:00 UTC and commits
them to `data/substack.json`. To refresh immediately: GitHub → **Actions**
→ *Fetch Substack Posts* → **Run workflow**.

## 5. Photos & CV

- Hero portrait: replace `assets/headshot.jpg` (keep the same filename).
- About-section photo: upload **`assets/about.jpg`** (until it exists, the
  site shows a field photo as fallback).
- CV: replace `assets/resume.pdf` (keep the same filename).
