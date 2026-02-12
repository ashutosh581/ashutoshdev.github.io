// Icons
lucide.createIcons();

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Slider logic per container
function initSliders() {
  document.querySelectorAll(".slider-container").forEach((container) => {
    const track = container.querySelector(".slider-track");
    const prevBtns = container.querySelectorAll(".prev-btn");
    const nextBtns = container.querySelectorAll(".next-btn");

    const getScrollAmount = () => {
      const first = track?.firstElementChild;
      if (!first) return 0;
      const w = first.getBoundingClientRect().width;
      // gap-6 = 24px
      return w + 24;
    };

    prevBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!track) return;
        track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
      });
    });

    nextBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!track) return;
        track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
      });
    });
  });
}

// --- Substack fetch (RSS -> JSON) ---
function stripTags(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function firstImageFromHtml(html) {
  const m = String(html || "").match(/<img[^>]+src="([^">]+)"/i);
  return m ? m[1] : null;
}

function estimateReadTimeMinutes(text) {
  const words = stripTags(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

async function loadSubstackPosts() {
  const track = document.getElementById("substackTrack");
  const status = document.getElementById("substackStatus");
  if (!track) return;

  const feedUrl = "https://ashutoshdev.substack.com/feed";
  const api = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(feedUrl);

  try {
    if (status) status.textContent = "Loading latest posts…";

    const res = await fetch(api, { cache: "no-store" });
    if (!res.ok) throw new Error("RSS fetch failed");

    const data = await res.json();
    const items = (data.items || []).slice(0, 8);
    if (!items.length) throw new Error("No items found");

    track.innerHTML = items
      .map((item) => {
        const title = item.title || "Untitled";
        const link = item.link || "https://ashutoshdev.substack.com/";
        const date = item.pubDate ? formatDate(item.pubDate) : "";
        const excerpt = stripTags(item.description || item.content || "");
        const thumb = firstImageFromHtml(item.content || item.description || "");
        const mins = estimateReadTimeMinutes(item.content || item.description || "");

        // thumbnail block
        const thumbHtml = thumb
          ? `<img src="${thumb}" alt="" class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500">`
          : `<div class="w-full h-full flex items-center justify-center text-gray-500 text-sm bg-gray-100">No thumbnail</div>`;

        return `
          <a href="${link}" target="_blank" rel="noopener"
             class="w-full md:w-[420px] shrink-0 snap-center group block bg-white rounded-2xl border border-gray-200 hover:border-gray-400 transition-colors overflow-hidden">
            <div class="h-44">${thumbHtml}</div>
            <div class="p-6">
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                ${date}${date ? " • " : ""}${mins} min read
              </div>
              <h3 class="text-lg font-medium text-gray-900 leading-snug clamp-2 group-hover:underline">${title}</h3>
              <p class="text-sm text-gray-600 mt-2 clamp-3">${excerpt}</p>
            </div>
          </a>
        `;
      })
      .join("");

    if (status) status.textContent = "";
  } catch (err) {
    console.error(err);
    if (status) status.textContent = "Couldn’t load Substack posts automatically. Use the View all link.";
    // Keep existing fallback card in HTML if present
  }
}

// init
initSliders();
loadSubstackPosts();

