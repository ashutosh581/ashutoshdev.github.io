// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Theme (light default, optional toggle)
const root = document.documentElement;
const themeBtn = document.getElementById("themeBtn");

function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

const saved = localStorage.getItem("theme");
if (saved === "dark" || saved === "light") setTheme(saved);

themeBtn?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") || "light";
  setTheme(current === "light" ? "dark" : "light");
});

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const mobilePanel = document.getElementById("mobilePanel");

menuBtn?.addEventListener("click", () => {
  const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
  menuBtn.setAttribute("aria-expanded", String(!isOpen));
  mobilePanel.hidden = isOpen;
});

// Close mobile panel on click
mobilePanel?.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.tagName === "A") {
    menuBtn.setAttribute("aria-expanded", "false");
    mobilePanel.hidden = true;
  }
});
