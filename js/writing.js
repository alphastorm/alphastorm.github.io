(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initNavigation() {
    for (const toggle of document.querySelectorAll("[data-nav-toggle]")) {
      const navId = toggle.getAttribute("aria-controls");
      const nav = navId ? document.getElementById(navId) : null;
      if (!nav) continue;

      const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        toggle.textContent = open ? "×" : "≡";
        nav.dataset.open = String(open);
      };

      toggle.addEventListener("click", () => {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
      });

      nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) setOpen(false);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
          setOpen(false);
          toggle.focus();
        }
      });

      document.addEventListener("click", (event) => {
        if (toggle.getAttribute("aria-expanded") !== "true") return;
        if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
      });

      window.matchMedia("(min-width: 801px)").addEventListener("change", (event) => {
        if (event.matches) setOpen(false);
      });
    }
  }

  function initProgress() {
    const bar = document.querySelector("[data-reading-progress]");
    if (!bar) return;

    let ticking = false;
    const update = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.width = `${(progress * 100).toFixed(2)}%`;
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }

  function initCodeCopy() {
    const live = document.querySelector("[data-copy-status]");

    for (const button of document.querySelectorAll("[data-copy-code]")) {
      button.addEventListener("click", async () => {
        const block = button.closest(".code-block");
        const code = block && block.querySelector("pre code");
        if (!code) return;

        try {
          await copyText(code.innerText);
          button.textContent = "COPIED";
          button.dataset.copied = "true";
          if (live) live.textContent = "Code copied to clipboard";
          window.setTimeout(() => {
            button.textContent = "COPY";
            button.dataset.copied = "false";
            if (live) live.textContent = "";
          }, 1200);
        } catch {
          button.textContent = "RETRY";
          if (live) live.textContent = "Copy failed";
        }
      });
    }
  }

  function initToc() {
    const toc = document.querySelector("[data-toc]");
    if (!toc) return;

    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    const sections = links
      .map((link) => document.getElementById(link.hash.slice(1)))
      .filter(Boolean);
    if (!sections.length) return;

    const setActive = (id) => {
      for (const link of links) {
        if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    setActive(sections[0].id);

    for (const link of links) {
      link.addEventListener("click", (event) => {
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", link.hash);
        setActive(target.id);
      });
    }
  }

  function initUnicornRail() {
    if (!document.querySelector("[data-us-project-src]") || !window.UnicornStudio) return;
    Promise.resolve(window.UnicornStudio.init()).catch(() => {
      document.documentElement.classList.add("unicorn-unavailable");
    });
  }

  initNavigation();
  initProgress();
  initCodeCopy();
  initToc();
  initUnicornRail();
})();
