(() => {
  const SUBSTACK_BASE = "https://ashutoshdev.substack.com";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

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
      raw?.canonical_url ||
      raw?.canonicalUrl ||
      raw?.url ||
      raw?.link ||
      (raw?.slug ? `${SUBSTACK_BASE}/p/${raw.slug}` : SUBSTACK_BASE);

    const cover =
      raw?.cover_image ||
      raw?.coverImage ||
      raw?.cover_image_url ||
      raw?.social_image ||
      raw?.image ||
      raw?.thumbnail ||
      null;

    const date =
      raw?.post_date ||
      raw?.postDate ||
      raw?.published_at ||
      raw?.pubDate ||
      raw?.date ||
      null;

    const subtitle =
      raw?.subtitle ||
      raw?.description ||
      raw?.sub_title ||
      raw?.teaser ||
      "";

    return { title, url, cover, date, subtitle };
  }

  function formatDate(dateLike) {
    if (!dateLike) return "";
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderSubstackCard(post) {
    const title = escapeHtml(post.title);
    const subtitle = escapeHtml(post.subtitle || "");
    const date = formatDate(post.date);

    const img = post.cover
      ? `<img src="${post.cover}" alt="${title}" class="w-full h-full object-cover" loading="lazy"
              onerror="this.outerHTML='<div class=&quot;w-full h-full image-fallback&quot;>Substack</div>'">`
      : `<div class="w-full h-full image-fallback">Substack</div>`;

    return `
      <a href="${post.url}" target="_blank" rel="noopener"
         class="w-[92%] md:w-[520px] shrink-0 snap-center bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
         data-slide>
        <div class="h-64 overflow-hidden bg-gray-100">${img}</div>
        <div class="p-7">
          <div class="flex items-center justify-between gap-3">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Writing</div>
            <div class="text-xs text-gray-500">${escapeHtml(date)}</div>
          </div>
          <h3 class="mt-3 text-xl font-semibold text-gray-900 leading-snug">${title}</h3>
          ${subtitle ? `<p class="mt-3 text-gray-600 leading-relaxed line-clamp-2">${subtitle}</p>` : ""}
          <div class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span>Open</span>
            <span aria-hidden="true">→</span>
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
        item.querySelector("description")?.textContent ||
        "";

      let cover = null;
      const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch && imgMatch[1]) cover = imgMatch[1];

      const descText = (item.querySelector("description")?.textContent || "")
        .replace(/<[^>]*>/g, "")
        .trim();

      return normalizePost({ title, link: url, pubDate, image: cover, description: descText });
    });
  }

  async function fetchSubstackPosts() {
    const archiveDirect = `${SUBSTACK_BASE}/api/v1/archive`;
    const archiveViaJina = `https://r.jina.ai/https://ashutoshdev.substack.com/api/v1/archive`;
    const archiveViaJinaHttp = `https://r.jina.ai/http://ashutoshdev.substack.com/api/v1/archive`;

    const archiveUrls = [archiveDirect, archiveViaJina, archiveViaJinaHttp];

    for (const url of archiveUrls) {
      try {
        const txt = await fetchText(url);
        const data = safeJsonParse(txt);

        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.posts)
            ? data.posts
            : Array.isArray(data?.items)
              ? data.items
              : null;

        if (arr && arr.length) {
          const posts = arr.map(normalizePost).filter(p => p.url && p.title);
          if (posts.length) return posts;
        }
      } catch (_) {}
    }

    const feedDirect = `${SUBSTACK_BASE}/feed`;
    const feedViaJina = `https://r.jina.ai/https://ashutoshdev.substack.com/feed`;
    const feedViaJinaHttp = `https://r.jina.ai/http://ashutoshdev.substack.com/feed`;

    const feedUrls = [feedDirect, feedViaJina, feedViaJinaHttp];

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

    track.innerHTML = `
      <div class="w-[92%] md:w-[520px] shrink-0 snap-center bg-white border border-gray-200 rounded-2xl overflow-hidden" data-slide>
        <div class="h-64 bg-gray-100"></div>
        <div class="p-7">
          <div class="h-3 w-24 bg-gray-200 rounded"></div>
          <div class="mt-4 h-5 w-3/4 bg-gray-200 rounded"></div>
          <div class="mt-3 h-4 w-5/6 bg-gray-200 rounded"></div>
          <div class="mt-2 h-4 w-2/3 bg-gray-200 rounded"></div>
        </div>
      </div>
    `;

    try {
      const posts = await fetchSubstackPosts();
      if (!posts.length) throw new Error("No posts returned");

      const limited = posts.slice(0, 10);
      track.innerHTML = limited.map(renderSubstackCard).join("");
      if (status) status.textContent = "Latest posts automatically pulled from Substack.";
      initIcons();
    } catch (err) {
      track.innerHTML = `
        <a href="${SUBSTACK_BASE}/archive" target="_blank" rel="noopener"
           class="w-[92%] md:w-[520px] shrink-0 snap-center bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
           data-slide>
          <div class="h-64 bg-gray-100 flex items-center justify-center text-gray-500">Substack</div>
          <div class="p-7">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Writing</div>
            <h3 class="mt-3 text-xl font-semibold text-gray-900">Open Substack →</h3>
            <p class="mt-3 text-gray-600 leading-relaxed">
              If posts don’t load here (hosting/CORS limits), open Substack directly.
            </p>
          </div>
        </a>
      `;
      if (status) status.textContent = "Couldn’t load posts automatically (hosting/CORS limits).";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initSliders();
    initIcons();
    loadWritingFromSubstack();
  });
})();

