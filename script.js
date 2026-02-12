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

// Works slider arrows
const slider = document.getElementById("workSlider");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function scrollByCard(dir) {
  if (!slider) return;
  const card = slider.querySelector(".workCard");
  const amount = card ? card.getBoundingClientRect().width + 14 : 380;
  slider.scrollBy({ left: dir * amount, behavior: "smooth" });
}

prevBtn?.addEventListener("click", () => scrollByCard(-1));
nextBtn?.addEventListener("click", () => scrollByCard(1));
