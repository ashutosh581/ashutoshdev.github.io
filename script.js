/* Ashutosh Dev — site logic
   Data sources (all auto-rendered, no HTML edits needed to add content):
     BibBase (Zotero)     → publication list, embedded directly in index.html
     data/consulting.json → consultation work gallery cards
     data/projects.json   → live project status cards
     data/articles.json   → op-eds & articles, tagged by category
                            (climate / energy / politics / creative)
     data/substack.json   → newsletter cards (refreshed daily by
                            .github/workflows/substack-fetch.yml); falls back to
                            fetching the Substack feed directly in the browser
   Paths resolve against document.body.dataset.root so the same script works on
   the homepage ("") and on writing/<topic>/ sub-pages ("../../"). */

(() => {
  const SUBSTACK_BASE = "https://ashutoshdev.substack.com";
  const ROOT = document.body.dataset.root || "";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(dateLike) {
    if (!dateLike) return "";
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }

  async function fetchJson(path) {
    const res = await fetch(ROOT + path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
    return await res.json();
  }

  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Chrome: year, nav, progress bar, back-to-top ──────────────────────────
  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  function initNav() {
    const nav = document.getElementById("siteNav");
    const toggle = document.getElementById("navToggle");
    const drawer = document.getElementById("navDrawer");
    const progress = document.getElementById("scrollProgress");
    const toTop = document.getElementById("toTop");

    if (toggle && drawer) {
      const setOpen = (open) => {
        drawer.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
      };
      toggle.addEventListener("click", () => setOpen(!drawer.classList.contains("open")));
      $$("a", drawer).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    }

    const onScroll = () => {
      const y = window.scrollY;
      if (nav) nav.classList.toggle("scrolled", y > 10);
      if (toTop) toTop.classList.toggle("show", y > 700);
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = max > 0 ? `${(y / max) * 100}%` : "0";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", () =>
        window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? "auto" : "smooth" }));
    }

    // Highlight the nav link of the section currently in view
    const navLinks = $$("[data-nav]");
    const sections = navLinks
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    if (navLinks.length && sections.length && "IntersectionObserver" in window) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      sections.forEach((s) => spy.observe(s));
    }
  }

  // ── Reveal-on-scroll ──────────────────────────────────────────────────────
  // The opacity-0 start state only applies under html.js (set inline in
  // <head>), so a broken script can't blank the page. As extra insurance,
  // anything still hidden 2.5s after load is forced visible.
  function initReveal() {
    const els = $$(".reveal");
    if (!els.length) return;
    if (REDUCED_MOTION || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    setTimeout(() => {
      els.forEach((el) => {
        if (!el.classList.contains("in") &&
            el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("in");
        }
      });
    }, 2500);
  }

  // ── Horizontal scroller buttons ───────────────────────────────────────────
  function initScrollers() {
    $$(".scroll-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const track = document.getElementById(btn.dataset.target);
        if (!track) return;
        const card = track.querySelector("[data-slide]") || track.firstElementChild;
        const amount = card ? card.getBoundingClientRect().width + 20 : 340;
        track.scrollBy({
          left: amount * Number(btn.dataset.dir || 1),
          behavior: REDUCED_MOTION ? "auto" : "smooth",
        });
      });
    });
  }

  // ── BibBase loading note ──────────────────────────────────────────────────
  // BibBase injects its list next to its <script> tag. Remove the "loading"
  // note once content shows up; offer a Scholar link if it never does.
  function initBibbaseWatch() {
    const note = document.getElementById("bibbaseNote");
    const scroller = document.getElementById("bibbaseScroller");
    if (!note || !scroller) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const loaded = scroller.querySelector('[class*="bibbase"]') ||
        scroller.children.length > 3;
      if (loaded) {
        note.remove();
        clearInterval(timer);
      } else if (Date.now() - started > 10000) {
        note.innerHTML = `Couldn't load the publication list — view it on
          <a href="https://scholar.google.com/citations?user=attWSMsAAAAJ" target="_blank" rel="noopener">Google Scholar</a>.`;
        clearInterval(timer);
      }
    }, 500);
  }

  // ── Consulting work ───────────────────────────────────────────────────────
  function renderConsultCard(item) {
    const title = escapeHtml(item.title || "Untitled project");
    const client = escapeHtml(item.client || "");
    const date = formatDate(item.date);
    const desc = escapeHtml(item.description || "");
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const link = item.link || "";
    const image = item.image ? ROOT + item.image : "";
    const sample = item._sample ? `<span class="sample-badge">Sample — edit data/consulting.json</span>` : "";

    const meta = [client, date].filter(Boolean).join(" · ");
    const isPdf = link && !link.startsWith("http");

    const imgHtml = image
      ? `<img src="${escapeHtml(image)}" alt="${title}" class="consult-img" loading="lazy"
             onerror="this.outerHTML='<div class=\\'consult-img-fallback\\'>Report</div>'">`
      : `<div class="consult-img-fallback">Report</div>`;

    const linkHtml = link
      ? `<a class="consult-link" href="${escapeHtml(isPdf ? ROOT + link : link)}" ${isPdf ? "download" : 'target="_blank" rel="noopener"'}>
           ${isPdf ? "Download report ↧" : "View project →"}
         </a>`
      : `<span class="consult-link pending">Material coming soon</span>`;

    return `
      <article class="consult-card" data-slide>
        ${imgHtml}
        <div class="consult-body">
          ${meta ? `<p class="consult-meta">${meta}</p>` : ""}
          <h3 class="consult-title">${title}${sample}</h3>
          ${desc ? `<p class="consult-desc">${desc}</p>` : ""}
          ${tags.length ? `<div class="consult-tags">${tags.map((t) => `<span class="mini-tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
          ${linkHtml}
        </div>
      </article>`;
  }

  async function loadConsulting() {
    const track = document.getElementById("consultingTrack");
    if (!track) return;
    try {
      const items = await fetchJson("data/consulting.json");
      if (!Array.isArray(items) || !items.length) throw new Error("empty");
      track.innerHTML = items.map(renderConsultCard).join("");
    } catch (err) {
      track.innerHTML = `<p class="loading-note">Add entries to <code>data/consulting.json</code> and they will appear here.</p>`;
    }
  }

  // ── Live projects ─────────────────────────────────────────────────────────
  const STATUS_LABELS = { live: "Live", ongoing: "In progress", completed: "Completed" };

  function renderProjectCard(p) {
    const title = escapeHtml(p.title || "Untitled project");
    const desc = escapeHtml(p.description || "");
    const status = (p.status || "ongoing").toLowerCase();
    const label = STATUS_LABELS[status] || escapeHtml(p.status);
    const updated = p.updated ? `Updated ${formatDate(p.updated)}` : "";
    const link = p.link || "";
    const href = link && !link.startsWith("http") ? ROOT + link : link;
    const linkLabel = escapeHtml(p.linkLabel || "Open project →");

    return `
      <article class="project-card">
        <div class="project-top">
          <span class="status-badge status-${escapeHtml(status)}"><span class="dot"></span>${label}</span>
          ${updated ? `<span class="project-updated">${escapeHtml(updated)}</span>` : ""}
        </div>
        <h3 class="project-title">${title}</h3>
        ${desc ? `<p class="project-desc">${desc}</p>` : ""}
        ${Array.isArray(p.tags) && p.tags.length ? `<div class="consult-tags">${p.tags.map((t) => `<span class="mini-tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
        ${href ? `<a class="project-link" href="${escapeHtml(href)}" target="_blank" rel="noopener">${linkLabel}</a>` : ""}
      </article>`;
  }

  async function loadProjects() {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;
    try {
      const items = await fetchJson("data/projects.json");
      if (!Array.isArray(items) || !items.length) throw new Error("empty");
      grid.innerHTML = items.map(renderProjectCard).join("");
    } catch (err) {
      grid.innerHTML = `<p class="loading-note">Add entries to <code>data/projects.json</code> and they will appear here.</p>`;
    }
  }

  // ── Op-Eds & Articles ─────────────────────────────────────────────────────
  const CAT_LABELS = { climate: "Climate", energy: "Energy", politics: "Politics", creative: "Creative" };
  let ALL_ARTICLES = [];

  function renderArticleRow(a) {
    const title = escapeHtml(a.title || "Untitled");
    const outlet = escapeHtml([a.outlet, formatDate(a.date), a.language].filter(Boolean).join(" · "));
    const cat = (a.category || "").toLowerCase();
    const url = a.url || "#";
    const image = a.image ? ROOT + a.image : "";
    const sample = a._sample ? `<span class="sample-badge">Sample</span>` : "";

    const thumbHtml = image
      ? `<img src="${escapeHtml(image)}" alt="" class="article-thumb" loading="lazy"
             onerror="this.outerHTML='<div class=\\'article-thumb-fallback\\'>${escapeHtml(CAT_LABELS[cat] || "Article")}</div>'">`
      : `<div class="article-thumb-fallback">${escapeHtml(CAT_LABELS[cat] || "Article")}</div>`;

    return `
      <a class="article-row" href="${escapeHtml(url)}" target="_blank" rel="noopener" data-cat="${escapeHtml(cat)}">
        ${thumbHtml}
        <div class="article-info">
          <h3>${title}${sample}</h3>
          <p class="article-outlet">${outlet}</p>
        </div>
        ${cat ? `<span class="article-cat cat-${escapeHtml(cat)}">${escapeHtml(CAT_LABELS[cat] || cat)}</span>` : ""}
      </a>`;
  }

  function renderFeature(a) {
    if (!a) return "";
    const image = a.image ? ROOT + a.image : "";
    if (!image && !a.quote) return "";
    return `
      <div class="oped-feature">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(a.title || "")}" class="oped-feature-img"
             onerror="this.style.display='none'">` : "<div></div>"}
        <div>
          ${a.quote ? `<p class="oped-quote">“${escapeHtml(a.quote)}”</p>` : `<p class="oped-quote">${escapeHtml(a.title || "")}</p>`}
          <p class="oped-quote-src">${escapeHtml([a.outlet, formatDate(a.date)].filter(Boolean).join(" · "))}
            ${a.url ? ` — <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">read the piece</a>` : ""}
          </p>
        </div>
      </div>`;
  }

  function applyArticleFilter(cat) {
    const list = document.getElementById("articleList");
    if (!list) return;
    const items = cat === "all" ? ALL_ARTICLES : ALL_ARTICLES.filter((a) => (a.category || "").toLowerCase() === cat);
    list.innerHTML = items.length
      ? items.map(renderArticleRow).join("")
      : `<p class="loading-note">No articles in this category yet.</p>`;
  }

  async function loadArticles() {
    const list = document.getElementById("articleList");
    const feature = document.getElementById("opedFeature");
    const tabs = document.getElementById("topicTabs");

    try {
      const items = await fetchJson("data/articles.json");
      if (!Array.isArray(items)) throw new Error("bad format");
      ALL_ARTICLES = items.slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      // Homepage: featured clipping + filterable list
      if (feature) feature.innerHTML = renderFeature(ALL_ARTICLES.find((a) => a.featured));
      if (list) applyArticleFilter("all");

      if (tabs) {
        tabs.addEventListener("click", (e) => {
          const btn = e.target.closest(".tab[data-cat]");
          if (!btn) return;
          $$(".tab", tabs).forEach((t) => t.classList.remove("active"));
          btn.classList.add("active");
          applyArticleFilter(btn.dataset.cat);
        });
      }

      // Topic sub-pages: element with data-topic-list="<cat>"
      const topicList = document.querySelector("[data-topic-list]");
      if (topicList) {
        const cat = topicList.dataset.topicList;
        const filtered = ALL_ARTICLES.filter((a) => (a.category || "").toLowerCase() === cat);
        topicList.innerHTML = filtered.length
          ? filtered.map(renderArticleRow).join("")
          : `<p class="loading-note">No ${cat} pieces published yet — add them to <code>data/articles.json</code>.</p>`;
      }

    } catch (err) {
      if (list) list.innerHTML = `<p class="loading-note">Add entries to <code>data/articles.json</code> and they will appear here.</p>`;
    }
  }

  // ── Substack ──────────────────────────────────────────────────────────────
  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    return await res.text();
  }

  function safeJsonParse(text) {
    const idxObj = text.indexOf("{");
    const idxArr = text.indexOf("[");
    const start = (idxArr !== -1 && (idxArr < idxObj || idxObj === -1)) ? idxArr : idxObj;
    if (start === -1) throw new Error("No JSON found");
    return JSON.parse(text.slice(start));
  }

  function normalizePost(raw) {
    return {
      title: raw?.title || "Untitled",
      url: raw?.canonical_url || raw?.url || raw?.link || (raw?.slug ? `${SUBSTACK_BASE}/p/${raw.slug}` : SUBSTACK_BASE),
      cover: raw?.cover_image || raw?.cover_image_url || raw?.social_image || raw?.image || null,
      date: raw?.post_date || raw?.published_at || raw?.pubDate || raw?.date || null,
      subtitle: raw?.subtitle || raw?.description || "",
    };
  }

  function renderSubCard(post) {
    const title = escapeHtml(post.title);
    const img = post.cover
      ? `<img src="${post.cover}" alt="${title}" class="sub-card-img" loading="lazy"
             onerror="this.outerHTML='<div class=\\'sub-card-fallback\\'>Substack</div>'">`
      : `<div class="sub-card-fallback">Substack</div>`;
    return `
      <a href="${post.url}" target="_blank" rel="noopener" class="sub-card" data-slide>
        ${img}
        <div class="sub-card-body">
          <div class="sub-card-meta"><span>Substack</span><span>${escapeHtml(formatDate(post.date))}</span></div>
          <h3 class="sub-card-title">${title}</h3>
          ${post.subtitle ? `<p class="sub-card-sub">${escapeHtml(post.subtitle)}</p>` : ""}
        </div>
      </a>`;
  }

  function parseRss(xmlText) {
    const xml = new DOMParser().parseFromString(xmlText, "text/xml");
    return Array.from(xml.querySelectorAll("item")).map((item) => {
      const html = item.querySelector("content\\:encoded")?.textContent ||
        item.querySelector("description")?.textContent || "";
      const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
      return normalizePost({
        title: item.querySelector("title")?.textContent?.trim(),
        link: item.querySelector("link")?.textContent?.trim(),
        pubDate: item.querySelector("pubDate")?.textContent?.trim(),
        image: imgMatch ? imgMatch[1] : null,
        description: (item.querySelector("description")?.textContent || "").trim(),
      });
    });
  }

  async function fetchSubstackPosts() {
    // Primary source: data/substack.json, refreshed daily by the
    // substack-fetch GitHub Action (no CORS issues, works everywhere).
    try {
      const cached = await fetchJson("data/substack.json");
      const arr = Array.isArray(cached) ? cached : cached?.posts;
      if (Array.isArray(arr) && arr.length) return arr.map(normalizePost);
    } catch (_) {}
    // Fallbacks: fetch the Substack API/feed directly from the browser.
    const jsonUrls = [
      `${SUBSTACK_BASE}/api/v1/archive`,
      `https://r.jina.ai/${SUBSTACK_BASE}/api/v1/archive`,
    ];
    for (const url of jsonUrls) {
      try {
        const data = safeJsonParse(await fetchText(url));
        const arr = Array.isArray(data) ? data : data?.posts || data?.items;
        if (Array.isArray(arr) && arr.length) return arr.map(normalizePost);
      } catch (_) {}
    }
    const rssUrls = [`${SUBSTACK_BASE}/feed`, `https://r.jina.ai/${SUBSTACK_BASE}/feed`];
    for (const url of rssUrls) {
      try {
        const posts = parseRss(await fetchText(url));
        if (posts.length) return posts;
      } catch (_) {}
    }
    return [];
  }

  async function loadSubstack() {
    const track = document.getElementById("substackTrack");
    if (!track) return;
    try {
      const posts = await fetchSubstackPosts();
      if (!posts.length) throw new Error("no posts");
      track.innerHTML = posts.slice(0, 12).map(renderSubCard).join("");
    } catch (err) {
      track.innerHTML = `
        <a href="${SUBSTACK_BASE}/archive" target="_blank" rel="noopener" class="sub-card" data-slide>
          <div class="sub-card-fallback">Substack</div>
          <div class="sub-card-body">
            <h3 class="sub-card-title">Read on Substack →</h3>
            <p class="sub-card-sub">Posts couldn't load inline (browser CORS limits) — open the archive directly.</p>
          </div>
        </a>`;
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initNav();
    initReveal();
    initScrollers();
    initBibbaseWatch();
    loadConsulting();
    loadProjects();
    loadArticles();
    loadSubstack();
  });
})();
