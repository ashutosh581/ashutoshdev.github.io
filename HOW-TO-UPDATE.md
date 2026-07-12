# How to update this website

Everything on the site is driven by simple data files — you never need to
touch HTML to add content. Edit the files below directly on GitHub
(open the file → pencil icon → commit), and the site updates automatically
within a minute or two of the commit.

**Automatic (nothing to do):** Google Scholar publications (weekly GitHub
Action) and Substack posts (fetched live in the browser).
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

Two mechanisms, both already wired up:

1. **`publications.json`** — auto-updated weekly (Mondays 02:00 UTC) from
   Google Scholar by the GitHub Action
   (`.github/workflows/scholar-fetch.yml`). Drives the thumbnail gallery
   and the stats strip. You can also edit it manually to add thumbnails
   (`"thumbnail": "assets/…"`) or fix metadata — manual edits are
   preserved by the Action.
2. **`publications.bib`** — the BibTeX file rendered by **BibBase** as the
   full formatted bibliography (the "Full bibliography" panel). Add a
   standard BibTeX entry per new paper.

## 4. Substack

Nothing to do — the site pulls your latest posts from
`ashutoshdev.substack.com` automatically in the browser.

## 5. Photos & CV

- Hero portrait: replace `assets/headshot.jpg` (keep the same filename).
- CV: replace `assets/resume.pdf` (keep the same filename).
