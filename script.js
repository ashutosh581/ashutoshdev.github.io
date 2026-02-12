// script.js
(function () {
  // Lucide icons
  if (window.lucide) lucide.createIcons();

  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
    mobileMenu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => mobileMenu.classList.add("hidden"));
    });
  }

  // Generic slider controls for any .slider-container blocks
  document.querySelectorAll(".slider-container").forEach((container) => {
    const track = container.querySelector(".slider-track");
    if (!track) return;

    const prevBtns = container.querySelectorAll(".prev-btn");
    const nextBtns = container.querySelectorAll(".next-btn");

    const getScrollAmount = () => {
      const first = track.querySelector("article, div");
      if (!first) return 0;
      const style = window.getComputedStyle(track);
      const gap = parseInt(style.columnGap || style.gap || "24", 10) || 24;
      return first.getBoundingClientRect().width + gap;
    };

    prevBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
      })
    );

    nextBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
      })
    );
  });

  // Writing slider controls
  const writingTrack = document.getElementById("writingTrack");
  const writingPrev = document.getElementById("writingPrev");
  const writingNext = document.getElementById("writingNext");

  function scrollWriting(dir) {
    if (!writingTrack) return;
    const first = writingTrack.querySelector("article, div");
    const gap = 24;
    const amt = first ? first.getBoundingClientRect().width + gap : 520;
    writingTrack.scrollBy({ left: dir * amt, behavior: "smooth" });
  }

  if (writingPrev) writingPrev.addEventListener("click", () => scrollWriting(-1));
  if (writingNext) writingNext.addEventListener("click", () => scrollWriting(1));

  // Substack fetch (try archive API; fallback to RSS->JSON)
  const writingError = document.getElementById("writingError");
  const SUBSTACK_BASE = "https://ashutoshdev.substack.com";
  const MAX_POSTS = 8;

  async function fetchSubstackArchive() {
    // Substack archive endpoint (may work depending on CORS)
    const url = `${SUBSTACK_BASE}/api/v1/archive?sort=new&limit=${MAX_POSTS}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Substack archive fetch failed");
    const data = await res.json();
    // data is commonly an array of posts (objects). We'll normalize.
    if (!Array.isArray(data)) throw new Error("Unexpected archive payload");
    return data.map((p) => ({
      title: p.title,
      url: p.canonical_url || p.url || p.post_url,
      date: p.post_date || p.published_at || "",
      cover: p.cover_image || p.social_image || p.thumbnail_url || ""
    })).filter(p => p.title && p.url);
  }

  async function fetchSubstackRSS() {
    // Fallback via rss2json (3rd party)
    const rssUrl = encodeURIComponent(`${SUBSTACK_BASE}/feed`);
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("RSS fallback failed");
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) throw new Error("Unexpected RSS payload");
    return data.items.slice(0, MAX_POSTS).map((it) => ({
      title: it.title,
      url: it.link,
      date: it.pubDate || "",
      cover: (it.thumbnail || (it.enclosure && it.enclosure.link) || "")
    })).filter(p => p.title && p.url);
  }

  function formatDate(d) {
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  function renderWriting(posts) {
    if (!writingTrack) return;

    const cards = posts.map((p) => {
      const dateStr = formatDate(p.date);
      const cover = p.cover && typeof p.cover === "string" ? p.cover : "";

      return `
        <article class="w-[88vw] sm:w-[80vw] md:w-[520px] shrink-0 snap-center bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <a href="${p.url}" target="_blank" rel="noopener" class="block">
            <div class="h-56 ${cover ? "" : "image-fallback"} overflow-hidden">
              ${
                cover
                  ? `<img src="${cover}" alt="${p.title.replace(/"/g, "&quot;")}" class="w-full h-full object-cover">`
                  : `<div class="w-full h-full flex items-center justify-center text-gray-500 text-sm">Substack</div>`
              }
            </div>
            <div class="p-6">
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Writing${dateStr ? ` • ${dateStr}` : ""}</div>
              <h3 class="text-lg font-medium text-gray-900 leading-snug">${p.title}</h3>
              <div class="mt-3 text-sm font-semibold text-gray-900 underline underline-offset-4">Open →</div>
            </div>
          </a>
        </article>
      `;
    }).join("");

    writingTrack.innerHTML = cards || `
      <div class="w-[88vw] sm:w-[80vw] md:w-[520px] shrink-0 snap-center bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div class="h-48 image-fallback">Substack</div>
        <div class="p-6">
          <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Writing</div>
          <div class="text-gray-700">No posts returned. Use “View all”.</div>
        </div>
      </div>
    `;
  }

  async function initWriting() {
    if (!writingTrack) return;

    try {
      const posts = await fetchSubstackArchive();
      renderWriting(posts);
      if (window.lucide) lucide.createIcons();
      return;
    } catch (e) {
      // fall through
    }

    try {
      const posts = await fetchSubstackRSS();
      renderWriting(posts);
      if (window.lucide) lucide.createIcons();
      return;
    } catch (e) {
      // show fallback message
      if (writingError) writingError.classList.remove("hidden");
      // Keep whatever is currently in track but make it useful
      writingTrack.innerHTML = `
        <article class="w-[88vw] sm:w-[80vw] md:w-[520px] shrink-0 snap-center bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div class="h-56 image-fallback">Substack</div>
          <div class="p-6">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Writing</div>
            <h3 class="text-lg font-medium text-gray-900 leading-snug">Open Substack →</h3>
            <p class="text-gray-600 mt-2 text-sm">If posts don’t load here (CORS), open Substack directly.</p>
            <a class="mt-4 inline-flex items-center gap-2 text-sm font-medium border border-gray-300 px-5 py-2.5 rounded-full hover:bg-gray-900 hover:text-white transition-all"
               href="${SUBSTACK_BASE}" target="_blank" rel="noopener">
              Open Substack
            </a>
          </div>
        </article>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  initWriting();
})();
