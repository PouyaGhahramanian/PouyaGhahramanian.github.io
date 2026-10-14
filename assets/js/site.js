/* Theme toggle, mobile nav, and scroll state. No dependencies. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------------------------------------------------------------- theme */

  var toggle = document.getElementById("theme-toggle");

  function activeTheme() {
    return root.getAttribute("data-theme") || "dark";
  }

  function syncToggleLabel() {
    if (!toggle) return;
    var next = activeTheme() === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", "Switch to " + next + " theme");
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = activeTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      document.querySelector('meta[name="theme-color"]').setAttribute(
        "content", next === "dark" ? "#0e0f12" : "#faf8f5"
      );
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* private mode — the choice just will not persist */
      }
      syncToggleLabel();
    });
    syncToggleLabel();
  }

  /* ------------------------------------------------------------------ nav */

  var navToggle = document.getElementById("nav-toggle");
  var masthead = document.getElementById("masthead");

  if (navToggle && masthead) {
    navToggle.addEventListener("click", function () {
      var open = masthead.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && masthead.classList.contains("is-open")) {
        masthead.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
        navToggle.focus();
      }
    });
  }

  /* --------------------------------------------------------------- scroll */

  if (masthead) {
    var scrolled = false;
    var onScroll = function () {
      var next = window.scrollY > 12;
      if (next !== scrolled) {
        scrolled = next;
        masthead.classList.toggle("is-scrolled", next);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------- reveal sections on entry */

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var revealables = document.querySelectorAll("[data-reveal]");

  if (revealables.length && !reduceMotion.matches && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
    revealables.forEach(function (el) {
      el.classList.add("will-reveal");
      observer.observe(el);
    });
  }
})();
