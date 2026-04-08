(() => {
  const SUBSTACK_BASE = "https://ashutoshdev.substack.com";

  // ── Helpers ──────────────────────────────────────────────────────────────────
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

  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  // ── Slider / horizontal scroll ────────────────────────────────────────────────
  function initSliders() {
    $$(".slider-container").forEach((container) => {
      const track = $(".slider-track", container);
      if (!track) return;

      const prevBtns = $$(".prev-btn", container);
      const nextBtns = $$(".next-btn", container);

      const getGap = () => {
        const cs = window.getComputedStyle(track);
        const gap = parseFloat(cs.gap || cs.columnGap || "24");
        return Number.isFinite(gap) ? gap : 24;
      };

      const getScrollAmount = () => {
        const slide = track.querySelector("[data-slide]") || track.firstElementChild;
        if (!slide) return 0;
        return slide.getBoundingClientRect().width + getGap();
      };

      prevBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
        });
      });

      nextBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
        });
      });
    });
  }

  // ── Mobile hamburger menu ─────────────────────────────────────────────────────
  function initMobileMenu() {
    const btn = document.getElementById("hamburger-btn");
    const menu = document.getElementById("mobile-menu");
    const icon = document.getElementById("hamburger-icon");
    if (!btn || !menu) return;

    const close = () => {
      menu.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
        initIcons();
      }
    };

    btn.addEventListener("click", () => {
      const isOpen = menu.classList.contains("open");
      if (isOpen) {
        close();
      } else {
        menu.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        if (icon) {
          icon.setAttribute("data-lucide", "x");
          initIcons();
        }
      }
    });

    // Close menu when any mobile nav link is clicked
    $$(".mobile-nav-link", menu).forEach((link) => {
      link.addEventListener("click", close);
    });

    // Close menu on outside click
    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        close();
      }
    });
  }

  // ── Publications (reads from publications.json) ───────────────────────────────
  /**
   * Builds the Microlink screenshot URL for an article URL.
   * Falls back gracefully to a placeholder if the API call fails.
   * Free tier: https://microlink.io — limited req/month, enough for a small portfolio.
   */
  function microlinkScreenshotUrl(articleUrl) {
    return (
      "https://api.microlink.io/?url=" +
      encodeURIComponent(articleUrl) +
      "&screenshot=true&meta=false&embed=screenshot.url"
    );
  }

  function renderPublicationCard(pub) {
    const title = escapeHtml(pub.title || "Untitled");
    const journal = escapeHtml(pub.journal || "");
    const year = escapeHtml(String(pub.year || ""));
    const doi = escapeHtml(pub.doi || "");
    const url = pub.url || "#";
    const citations = pub.citations != null ? pub.citations : null;
    const isPlaceholder = !!(pub._note);

    // Prefer a local thumbnail; fall back to Microlink screenshot of the DOI page.
    const imgSrc = pub.thumbnail
      ? escapeHtml(pub.thumbnail)
      : microlinkScreenshotUrl(url);

    const badgeLabel = [journal, year].filter(Boolean).join(" \u2022 ");

    const placeholderBadge = isPlaceholder
      ? `<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 ml-2">Update needed</span>`
      : "";

    return `
      <a class="w-[88%] sm:w-[92%] md:w-[600px] shrink-0 snap-center bg-white border border-slate-200 rounded-2xl overflow-hidden card-hover"
         data-slide href="${escapeHtml(url)}" target="_blank" rel="noopener">
        <div class="h-44 sm:h-48 bg-slate-100 overflow-hidden relative">
          <img src="${imgSrc}" alt="${title}"
               class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
               loading="lazy"
               onerror="this.outerHTML='<div class=&quot;w-full h-full img-fallback&quot;>${escapeHtml(journal || "Publication")}</div>'">
        </div>
        <div class="p-6 sm:p-8">
          <div class="flex items-start gap-4">
            <div class="mt-1 bg-slate-900 text-white p-2 rounded-lg shrink-0">
              <i data-lucide="book-open" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 min-w-0">
              ${badgeLabel ? `<div class="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2 flex items-center flex-wrap gap-1">${badgeLabel}${placeholderBadge}</div>` : ""}
              <h3 class="text-base sm:text-lg font-semibold text-slate-900 leading-snug">${title}</h3>
              ${doi && !doi.startsWith("TODO") ? `<div class="mt-2 text-xs font-mono text-slate-500 truncate">DOI: ${doi}</div>` : ""}
              ${citations != null && !isPlaceholder ? `<div class="mt-1 text-xs text-slate-400">${citations} citation${citations !== 1 ? "s" : ""}</div>` : ""}
            </div>
          </div>
          <div class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors">
            <span>${isPlaceholder ? "View Scholar profile" : "Read paper"}</span><span aria-hidden="true">&rarr;</span>
          </div>
        </div>
      </a>
    `;
  }

  async function loadPublications() {
    const track = document.getElementById("pubTrack");
    const status = document.getElementById("pubStatus");
    if (!track) return;

    try {
      const res = await fetch("publications.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const pubs = await res.json();

      if (!Array.isArray(pubs) || pubs.length === 0) throw new Error("Empty");

      track.innerHTML = pubs.map(renderPublicationCard).join("");
      if (status) status.textContent = `${pubs.length} publication${pubs.length !== 1 ? "s" : ""} — updated automatically via GitHub Actions.`;
      initIcons();
      // Re-initialise sliders now that cards are injected
      initSliders();
    } catch (err) {
      track.innerHTML = `
        <div class="w-[88%] sm:w-[92%] md:w-[600px] shrink-0 snap-center bg-white border border-slate-200 rounded-2xl p-8 text-slate-500" data-slide>
          Could not load <code>publications.json</code>. Add publications to that file and they will appear here.
        </div>`;
      if (status) status.textContent = "Could not load publications.json.";
    }
  }

  // ── Consultant Reports (reads from data/reports.json) ─────────────────────────
  /**
   * To add a new consultant report:
   *   1. Edit data/reports.json — add an object with title, date, description, link, tags.
   *   2. Optionally place the PDF in assets/reports/ and update "link".
   * No JavaScript changes are needed.
   */
  function renderReportCard(report) {
    const title = escapeHtml(report.title || "Untitled Report");
    const date = formatDate(report.date);
    const description = escapeHtml(report.description || "");
    const link = report.link || "#";
    const tags = Array.isArray(report.tags) ? report.tags : [];
    const isDownload = link !== "#" && !link.startsWith("http");

    const tagHtml = tags
      .map((t) => `<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">${escapeHtml(t)}</span>`)
      .join("");

    const linkAttrs = isDownload
      ? `href="${escapeHtml(link)}" download`
      : `href="${escapeHtml(link)}" target="_blank" rel="noopener"`;

    return `
      <div class="bg-white border border-teal-100 rounded-2xl p-6 sm:p-7 flex flex-col gap-4 card-hover shadow-sm">
        ${date ? `<div class="text-xs font-bold text-slate-400 uppercase tracking-widest">${escapeHtml(date)}</div>` : ""}
        <div class="flex items-start gap-3">
          <div class="mt-0.5 bg-slate-900 text-white p-2 rounded-lg shrink-0">
            <i data-lucide="file-text" class="w-4 h-4"></i>
          </div>
          <h3 class="text-lg font-semibold text-slate-900 leading-snug">${title}</h3>
        </div>
        ${description ? `<p class="text-slate-500 leading-relaxed text-sm line-clamp-3">${description}</p>` : ""}
        ${tagHtml ? `<div class="flex flex-wrap gap-2">${tagHtml}</div>` : ""}
        <a ${linkAttrs}
           class="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors">
          ${isDownload ? '<i data-lucide="download" class="w-4 h-4"></i><span>Download PDF</span>' : '<i data-lucide="external-link" class="w-4 h-4"></i><span>View report</span>'}
        </a>
      </div>
    `;
  }

  async function loadReports() {
    const grid = document.getElementById("reportsGrid");
    if (!grid) return;

    try {
      const res = await fetch("data/reports.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reports = await res.json();

      if (!Array.isArray(reports) || reports.length === 0) throw new Error("Empty");

      grid.innerHTML = reports.map(renderReportCard).join("");
      initIcons();
    } catch (err) {
      grid.innerHTML = `
        <div class="col-span-full bg-white border border-teal-100 rounded-2xl p-8 text-slate-500">
          Could not load <code>data/reports.json</code>. Add report entries to that file and they will appear here.
        </div>`;
    }
  }

  // ── Substack / Writing ────────────────────────────────────────────────────────
  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
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
    const title = raw?.title || raw?.name || "Untitled";
    const url =
      raw?.canonical_url || raw?.canonicalUrl || raw?.url || raw?.link ||
      (raw?.slug ? `${SUBSTACK_BASE}/p/${raw.slug}` : SUBSTACK_BASE);
    const cover =
      raw?.cover_image || raw?.coverImage || raw?.cover_image_url ||
      raw?.social_image || raw?.image || raw?.thumbnail || null;
    const date =
      raw?.post_date || raw?.postDate || raw?.published_at ||
      raw?.pubDate || raw?.date || null;
    const subtitle =
      raw?.subtitle || raw?.description || raw?.sub_title || raw?.teaser || "";
    return { title, url, cover, date, subtitle };
  }

  function renderSubstackCard(post) {
    const title = escapeHtml(post.title);
    const subtitle = escapeHtml(post.subtitle || "");
    const date = formatDate(post.date);

    const img = post.cover
      ? `<img src="${post.cover}" alt="${title}" class="w-full h-full object-cover" loading="lazy"
              onerror="this.outerHTML='<div class=&quot;w-full h-full img-fallback&quot;>Substack</div>'">`
      : `<div class="w-full h-full img-fallback">Substack</div>`;

    return `
      <a href="${post.url}" target="_blank" rel="noopener"
         class="w-[88%] sm:w-[92%] md:w-[520px] shrink-0 snap-center bg-white border border-slate-200 rounded-2xl overflow-hidden card-hover"
         data-slide>
        <div class="h-52 sm:h-64 overflow-hidden bg-slate-100">${img}</div>
        <div class="p-6 sm:p-7">
          <div class="flex items-center justify-between gap-3">
            <div class="text-xs font-bold text-teal-600 uppercase tracking-widest">Writing</div>
            <div class="text-xs text-slate-400">${escapeHtml(date)}</div>
          </div>
          <h3 class="mt-3 text-lg sm:text-xl font-semibold text-slate-900 leading-snug">${title}</h3>
          ${subtitle ? `<p class="mt-3 text-slate-500 leading-relaxed line-clamp-2 text-sm sm:text-base">${subtitle}</p>` : ""}
          <div class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors">
            <span>Read</span><span aria-hidden="true">&rarr;</span>
          </div>
        </div>
      </a>
    `;
  }

  function parseRssToPosts(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");
    const items = Array.from(xml.querySelectorAll("item"));
    return items.map((item) => {
      const title = item.querySelector("title")?.textContent?.trim() || "Untitled";
      const url = item.querySelector("link")?.textContent?.trim() || SUBSTACK_BASE;
      const pubDate = item.querySelector("pubDate")?.textContent?.trim() || null;
      const html =
        item.querySelector("content\\:encoded")?.textContent ||
        item.querySelector("description")?.textContent || "";
      let cover = null;
      const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch && imgMatch[1]) cover = imgMatch[1];
      const descText = (item.querySelector("description")?.textContent || "").trim();
      return normalizePost({ title, link: url, pubDate, image: cover, description: descText });
    });
  }

  async function fetchSubstackPosts() {
    const archiveUrls = [
      `${SUBSTACK_BASE}/api/v1/archive`,
      `https://r.jina.ai/https://ashutoshdev.substack.com/api/v1/archive`,
      `https://r.jina.ai/http://ashutoshdev.substack.com/api/v1/archive`,
    ];

    for (const url of archiveUrls) {
      try {
        const txt = await fetchText(url);
        const data = safeJsonParse(txt);
        const arr = Array.isArray(data) ? data
          : Array.isArray(data?.posts) ? data.posts
          : Array.isArray(data?.items) ? data.items : null;
        if (arr && arr.length) {
          const posts = arr.map(normalizePost).filter((p) => p.url && p.title);
          if (posts.length) return posts;
        }
      } catch (_) {}
    }

    const feedUrls = [
      `${SUBSTACK_BASE}/feed`,
      `https://r.jina.ai/https://ashutoshdev.substack.com/feed`,
      `https://r.jina.ai/http://ashutoshdev.substack.com/feed`,
    ];

    for (const url of feedUrls) {
      try {
        const xmlText = await fetchText(url);
        const posts = parseRssToPosts(xmlText);
        if (posts.length) return posts;
      } catch (_) {}
    }

    return [];
  }

  async function loadWritingFromSubstack() {
    const track = document.getElementById("substackTrack");
    const status = document.getElementById("substackStatus");
    const openBtn = document.getElementById("substackOpen");

    if (!track) return;
    if (openBtn) openBtn.href = `${SUBSTACK_BASE}/archive`;

    // Show loading skeleton
    track.innerHTML = `
      <div class="w-[88%] sm:w-[92%] md:w-[520px] shrink-0 snap-center bg-white border border-slate-200 rounded-2xl overflow-hidden" data-slide>
        <div class="h-52 sm:h-64 bg-slate-100 animate-pulse"></div>
        <div class="p-6 sm:p-7">
          <div class="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
          <div class="mt-4 h-5 w-3/4 bg-slate-200 rounded animate-pulse"></div>
          <div class="mt-3 h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
          <div class="mt-2 h-4 w-2/3 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </div>
    `;

    try {
      const posts = await fetchSubstackPosts();
      if (!posts.length) throw new Error("No posts returned");

      track.innerHTML = posts.slice(0, 10).map(renderSubstackCard).join("");
      if (status) status.textContent = "Latest posts automatically pulled from Substack.";
      initIcons();
    } catch (err) {
      track.innerHTML = `
        <a href="${SUBSTACK_BASE}/archive" target="_blank" rel="noopener"
           class="w-[88%] sm:w-[92%] md:w-[520px] shrink-0 snap-center bg-white border border-slate-200 rounded-2xl overflow-hidden card-hover"
           data-slide>
          <div class="h-52 sm:h-64 bg-slate-100 flex items-center justify-center text-slate-400">Substack</div>
          <div class="p-6 sm:p-7">
            <div class="text-xs font-bold text-teal-600 uppercase tracking-widest">Writing</div>
            <h3 class="mt-3 text-xl font-semibold text-slate-900 serif">Open Substack &rarr;</h3>
            <p class="mt-3 text-slate-500 leading-relaxed text-sm sm:text-base">
              Posts couldn&rsquo;t load here (CORS/hosting limits) &mdash; open Substack directly.
            </p>
          </div>
        </a>
      `;
      if (status) status.textContent = "Couldn\u2019t load posts automatically (CORS/hosting limits).";
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initMobileMenu();
    initSliders();
    initIcons();
    loadPublications();
    loadReports();
    loadWritingFromSubstack();
  });
})();
