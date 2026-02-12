// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const mobileNav = document.getElementById("mobileNav");

menuBtn?.addEventListener("click", () => {
  const open = menuBtn.getAttribute("aria-expanded") === "true";
  menuBtn.setAttribute("aria-expanded", String(!open));
  mobileNav.hidden = open;
});

mobileNav?.addEventListener("click", (e) => {
  if (e.target && e.target.tagName === "A") {
    menuBtn.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  }
});

// Generic gallery init (track + arrows + dots)
function initGallery({ trackId, prevId, nextId, dotsId }) {
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  const dotsWrap = document.getElementById(dotsId);

  if (!track) return;

  const items = Array.from(track.children).filter(el =>
    el.classList.contains("slide") || el.classList.contains("card")
  );
  if (items.length === 0) return;

  let activeIndex = 0;

  function scrollTo(i) {
    items[i]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function getClosestIndex() {
    const left = track.scrollLeft;
    let best = 0;
    let bestDist = Infinity;
    items.forEach((s, i) => {
      const dist = Math.abs(s.offsetLeft - left);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    return best;
  }

  function setActiveDot(i) {
    if (!dotsWrap) return;
    const btns = Array.from(dotsWrap.querySelectorAll(".dotBtn"));
    btns.forEach((b, idx) => b.classList.toggle("active", idx === i));
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    items.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "dotBtn" + (i === 0 ? " active" : "");
      b.type = "button";
      b.setAttribute("aria-label", `Go to item ${i + 1}`);
      b.addEventListener("click", () => scrollTo(i));
      dotsWrap.appendChild(b);
    });
  }

  function next() {
    activeIndex = Math.min(activeIndex + 1, items.length - 1);
    scrollTo(activeIndex);
  }

  function prev() {
    activeIndex = Math.max(activeIndex - 1, 0);
    scrollTo(activeIndex);
  }

  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);

  // Keyboard support when the carousel is focused
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  // Update active dot on scroll (throttled)
  let ticking = false;
  track.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      activeIndex = getClosestIndex();
      setActiveDot(activeIndex);
      ticking = false;
    });
  });

  buildDots();
}

// Init sliders
initGallery({ trackId: "carbonTrack",  prevId: "carbonPrev",  nextId: "carbonNext",  dotsId: "carbonDots" });
initGallery({ trackId: "researchTrack", prevId: "researchPrev", nextId: "researchNext", dotsId: "researchDots" });
initGallery({ trackId: "pubTrack",     prevId: "pubPrev",     nextId: "pubNext",     dotsId: "pubDots" });
initGallery({ trackId: "writeTrack",   prevId: "writePrev",   nextId: "writeNext",   dotsId: "writeDots" });

// Focus slider (themes)
const focusItems = [
  "Carbon pricing MRV & institutional design (Nepal)",
  "Verification pathways, QA/QC, and registry readiness",
  "Community-first monitoring & field implementation",
  "Energy system optimisation (ORC / geothermal)",
  "Surrogate modelling & scenario-based sensitivity",
  "System dynamics for policy trade-offs (Vensim)"
];

let focusIndex = 0;
const focusValue = document.getElementById("focusValue");
const focusChips = document.getElementById("focusChips");

function renderFocus() {
  if (focusValue) focusValue.textContent = focusItems[focusIndex];

  if (focusChips) {
    focusChips.innerHTML = "";
    focusItems.forEach((t, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "focusChip" + (i === focusIndex ? " active" : "");
      b.textContent = t;
      b.addEventListener("click", () => {
        focusIndex = i;
        renderFocus();
      });
      focusChips.appendChild(b);
    });
  }
}

document.getElementById("focusPrev")?.addEventListener("click", () => {
  focusIndex = (focusIndex - 1 + focusItems.length) % focusItems.length;
  renderFocus();
});

document.getElementById("focusNext")?.addEventListener("click", () => {
  focusIndex = (focusIndex + 1) % focusItems.length;
  renderFocus();
});

renderFocus();

// Copy DOI buttons
document.querySelectorAll("[data-copy]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const text = btn.getAttribute("data-copy") || "";
    try {
      await navigator.clipboard.writeText(text);
      const old = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = old), 900);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      const old = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = old), 900);
    }
  });
});
