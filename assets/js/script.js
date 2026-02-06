const KEYCHAINS = window.KEYCHAINS || [];

const grid = document.getElementById("character-grid");
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const mobileMenu = document.getElementById("mobile-menu");
const mobileToggle = document.getElementById("mobile-toggle");
const mobileClose = document.getElementById("mobile-close");

const modalColorBar = document.getElementById("modal-color-bar");
const modalImageContainer = document.getElementById("modal-image-container");
const modalName = document.getElementById("modal-name");
const modalTagline = document.getElementById("modal-tagline");
const modalPersonality = document.getElementById("modal-personality");
const modalFood = document.getElementById("modal-food");
const modalHobby = document.getElementById("modal-hobby");
const modalAdoptBtn = document.getElementById("modal-adopt-btn");

const isImageSource = (source) =>
  source.startsWith("http") || source.startsWith("./");

const buildMediaNode = (source) => {
  if (isImageSource(source)) {
    const img = document.createElement("img");
    img.src = source;
    img.alt = "Pockitz";
    img.className = "keychain-img";
    img.addEventListener("error", () => {
      img.replaceWith(document.createTextNode("KP"));
    });
    return img;
  }
  return document.createTextNode(source);
};

window.buildMediaNode = buildMediaNode;

const withAlpha = (color, alpha) => {
  if (!color) return `rgba(0,0,0,${alpha})`;
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const full = hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
    const int = parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (color.startsWith("rgb(")) {
    const parts = color.replace("rgb(", "").replace(")", "").split(",").map((v) => v.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
  }
  return color;
};

const setBodyLock = (locked, className) => {
  document.body.classList.toggle(className, locked);
};

const openMobileMenu = () => {
  if (!mobileMenu || !mobileToggle) return;
  mobileMenu.classList.add("is-open");
  mobileMenu.setAttribute("aria-hidden", "false");
  mobileToggle.setAttribute("aria-expanded", "true");
  setBodyLock(true, "menu-open");
};

const closeMobileMenu = () => {
  if (!mobileMenu || !mobileToggle) return;
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
  mobileToggle.setAttribute("aria-expanded", "false");
  setBodyLock(false, "menu-open");
};

const toggleMobileMenu = () => {
  if (mobileMenu.classList.contains("is-open")) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
};

const renderCards = (items = KEYCHAINS) => {
  if (!grid) return;
  grid.textContent = "";
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className =
      "character-card bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center";
    card.dataset.id = String(item.id);
    card.style.background = `linear-gradient(180deg, white 0%, ${withAlpha(item.color, 0.16)} 100%)`;

    const mediaWrap = document.createElement("div");
    mediaWrap.className =
      "card-media w-28 h-28 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-5xl md:text-6xl mb-6 shadow-inner border-4 border-white overflow-hidden floating";
    mediaWrap.style.backgroundColor = withAlpha(item.color, 0.38);
    mediaWrap.appendChild(buildMediaNode(item.image));

    const name = document.createElement("h3");
    name.className = "text-2xl font-bold mb-1";
    name.textContent = item.name;

    const tagline = document.createElement("p");
    tagline.className =
      "text-xs text-gray-400 font-bold mb-4 uppercase tracking-widest";
    tagline.textContent = item.tagline;

    card.appendChild(mediaWrap);
    card.appendChild(name);
    card.appendChild(tagline);

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
};

const openModal = (id) => {
  if (!modal) return;
  const char = KEYCHAINS.find((c) => c.id === id);
  if (!char) return;

  modalColorBar.style.backgroundColor = char.color;
  modalImageContainer.style.backgroundColor = `${char.color}44`;
  modalImageContainer.textContent = "";
  modalImageContainer.appendChild(buildMediaNode(char.image));

  modalName.textContent = char.name;
  modalTagline.textContent = char.tagline;
  modalPersonality.textContent = char.personality;
  modalFood.textContent = char.favFood;
  modalHobby.textContent = char.hobby;
  modalAdoptBtn.href = char.shopUrl || "#";
  modalAdoptBtn.target = "_blank";
  modalAdoptBtn.rel = "noopener";
  modalAdoptBtn.style.backgroundColor = char.color;
  modalAdoptBtn.style.borderColor = char.color;
  modalAdoptBtn.style.color = "#ffffff";
  modalAdoptBtn.style.textShadow =
    "0 1px 2px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.75)";

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  setBodyLock(true, "modal-open");
};

const closeModal = () => {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  setBodyLock(false, "modal-open");
};

if (mobileToggle && mobileClose && mobileMenu) {
  mobileToggle.addEventListener("click", toggleMobileMenu);
  mobileClose.addEventListener("click", closeMobileMenu);
  mobileMenu.addEventListener("click", (event) => {
    if (event.target.classList.contains("mobile-link")) {
      closeMobileMenu();
    }
  });
  const mobileBackdrop = mobileMenu.querySelector(".mobile-backdrop");
  if (mobileBackdrop) {
    mobileBackdrop.addEventListener("click", closeMobileMenu);
  }
}

if (modal && modalClose) {
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
}

if (grid) {
  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".character-card");
    if (!card) return;
    const id = Number(card.dataset.id);
    if (!Number.isNaN(id)) openModal(id);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (modal && !modal.classList.contains("hidden")) closeModal();
    if (mobileMenu && mobileMenu.classList.contains("is-open")) closeMobileMenu();
  }
});

document.querySelectorAll(".nav-pill").forEach((pill) => {
  pill.addEventListener("pointerdown", (event) => {
    pill.classList.add("is-pressed");

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    const rect = pill.getBoundingClientRect();
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    pill.appendChild(ripple);

    ripple.addEventListener("animationend", () => ripple.remove(), {
      once: true,
    });
  });

  pill.addEventListener("pointerup", () => {
    pill.classList.remove("is-pressed");
  });

  pill.addEventListener("pointerleave", () => {
    pill.classList.remove("is-pressed");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  renderCards();
  let activeFilter = "all";
  let searchQuery = "";
  const searchInput = document.getElementById("search-input");

  const noResults = document.getElementById("no-results");

  const applyFilters = () => {
    const query = searchQuery.trim().toLowerCase();
    let items = KEYCHAINS;

    if (activeFilter !== "all") {
      items = items.filter(
        (item) =>
          Array.isArray(item.categories) &&
          item.categories.includes(activeFilter)
      );
    }

    if (query) {
      items = items.filter((item) => {
        const haystack = [
          item.name,
          item.tagline,
          item.personality,
          item.hobby,
          item.favFood,
          Array.isArray(item.categories) ? item.categories.join(" ") : "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    renderCards(items);
    if (noResults) {
      noResults.classList.toggle("hidden", items.length !== 0);
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      searchQuery = event.target.value || "";
      applyFilters();
    });
  }

  const crewBar = document.getElementById("crew-bar");
  const searchSlot = document.getElementById("search-slot");
  const headerSlot = document.getElementById("search-header-slot");
  if (crewBar && searchSlot && headerSlot) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!searchSlot.parentElement?.isSameNode(crewBar)) {
            const searchWrap = searchSlot;
            const container = crewBar.querySelector(".search-wrap")?.parentElement || crewBar;
            container.appendChild(searchWrap);
          }
          headerSlot.classList.add("hidden");
        } else {
          if (!headerSlot.contains(searchSlot)) {
            headerSlot.appendChild(searchSlot);
          }
          headerSlot.classList.remove("hidden");
        }
      },
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(crewBar);
  }
  const filterList = document.getElementById("filter-list");
  const filterPanel = document.getElementById("filter-panel");
  const filterToggle = document.getElementById("filter-toggle");
  if (filterPanel && filterToggle) {
    const setOpen = (open) => {
      filterPanel.classList.toggle("is-open", open);
      filterToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    setOpen(false);
    filterToggle.addEventListener("click", () => {
      const isOpen = filterPanel.classList.contains("is-open");
      setOpen(!isOpen);
    });
  }
  if (filterList) {
    filterList.addEventListener("click", (event) => {
      const button = event.target.closest(".filter-pill");
      if (!button) return;
      const filter = button.dataset.filter;
      filterList.querySelectorAll(".filter-pill").forEach((pill) => {
        pill.classList.toggle("is-active", pill === button);
      });
      activeFilter = filter || "all";
      applyFilters();
      if (filterPanel) filterPanel.classList.remove("is-open");
    });
  }
  const statusEl = document.getElementById("contact-status");
  const errorEl = document.getElementById("contact-error");
  if (statusEl) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sent") === "1") {
      statusEl.classList.remove("hidden");
    }
  }
  const contactForm = document.getElementById("contact-form");
  if (contactForm && statusEl) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      statusEl.classList.add("hidden");
      if (errorEl) errorEl.classList.add("hidden");

      const submitBtn = contactForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      try {
        const response = await fetch(contactForm.action, {
          method: "POST",
          body: new FormData(contactForm),
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send message.");
        }

        window.location.href = "/contact?sent=1";
      } catch (error) {
        if (errorEl) {
          errorEl.textContent = error.message || "Something went wrong.";
          errorEl.classList.remove("hidden");
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Message";
        }
      }
    });
  }
});
