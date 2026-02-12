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

  const slides = Array.from(track.querySelectorAll(".slide"));
  if (slides.length === 0) return;

  let activeIndex = 0;

  function scrollToSlide(i) {
    if (!slides[i]) return;
    slides[i].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function getClosestSlideIndex() {
    const left = track.scrollLeft;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((s, i) => {
      const dist = Math.abs(s.offsetLeft - left);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
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
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "dotBtn" + (i === 0 ? " active" : "");
      b.type = "button";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.addEventListener("click", () => scrollToSlide(i));
      dotsWrap.appendChild(b);
    });
  }

  function next() {
    activeIndex = Math.min(activeIndex + 1, slides.length - 1);
    scrollToSlide(activeIndex);
  }

  function prev() {
    activeIndex = Math.max(activeIndex - 1, 0);
    scrollToSlide(activeIndex);
  }

  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);

  // Keyboard support when focused
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
      activeIndex = getClosestSlideIndex();
      setActiveDot(activeIndex);
      ticking = false;
    });
  });

  buildDots();
}

// Init both sections
initGallery({ trackId: "carbonTrack", prevId: "carbonPrev", nextId: "carbonNext", dotsId: "carbonDots" });
initGallery({ trackId: "researchTrack", prevId: "researchPrev", nextId: "researchNext", dotsId: "researchDots" });
