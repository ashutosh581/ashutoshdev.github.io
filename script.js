// Icons
lucide.createIcons();

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Slider logic per container
document.querySelectorAll(".slider-container").forEach((container) => {
  const track = container.querySelector(".slider-track");
  const prevBtns = container.querySelectorAll(".prev-btn");
  const nextBtns = container.querySelectorAll(".next-btn");

  const getScrollAmount = () => {
    const firstChild = track?.querySelector("div");
    if (!firstChild) return 0;
    // gap-6 in Tailwind = 24px
    return firstChild.offsetWidth + 24;
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

