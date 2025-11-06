"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/pro/session-tabs.ts
  function initTabMenuScrolling() {
    const tabMenu = document.querySelector(".cc_pro_session-tab-menu");
    const tabsContainer = document.querySelector(".cc_pro_session-tabs");
    if (!tabMenu) {
      return;
    }
    if (!tabsContainer) {
      return;
    }
    const maxWidthPx = 1200;
    const checkAndSetupScrolling = () => {
      const containerWidth = tabMenu.offsetWidth;
      if (containerWidth < maxWidthPx) {
        const prevButton = document.querySelector(".cc_pro_tabs_button.prev");
        const nextButton = document.querySelector(".cc_pro_tabs_button.next");
        if (prevButton && nextButton) {
          if (!tabsContainer.contains(prevButton)) {
            tabsContainer.appendChild(prevButton);
          }
          if (!tabsContainer.contains(nextButton)) {
            tabsContainer.appendChild(nextButton);
          }
          const tabLink = tabMenu.querySelector(".cc_pro_session-tab");
          const scrollAmount = tabLink ? tabLink.offsetWidth : 200;
          const { overflowX } = getComputedStyle(tabMenu);
          if (overflowX !== "auto" && overflowX !== "scroll") {
            tabMenu.style.overflowX = "auto";
          }
          const updateScrollState = () => {
            const { scrollLeft } = tabMenu;
            const { scrollWidth } = tabMenu;
            const { clientWidth } = tabMenu;
            const isAtLeft = scrollLeft <= 1;
            const isAtRight = scrollLeft + clientWidth >= scrollWidth - 1;
            if (isAtLeft && isAtRight) {
              prevButton.style.display = "none";
              nextButton.style.display = "none";
            } else if (isAtLeft) {
              prevButton.style.display = "none";
              nextButton.style.display = "";
            } else if (isAtRight) {
              prevButton.style.display = "";
              nextButton.style.display = "none";
            } else {
              prevButton.style.display = "";
              nextButton.style.display = "";
            }
          };
          if (!tabMenu.dataset.scrollListenerAttached) {
            tabMenu.addEventListener("scroll", updateScrollState);
            tabMenu.dataset.scrollListenerAttached = "true";
          }
          updateScrollState();
          if (!prevButton.dataset.scrollHandlerAttached) {
            prevButton.addEventListener("click", () => {
              tabMenu.scrollBy({ left: -scrollAmount, behavior: "smooth" });
              setTimeout(() => {
                updateScrollState();
              }, 300);
            });
            prevButton.dataset.scrollHandlerAttached = "true";
          }
          if (!nextButton.dataset.scrollHandlerAttached) {
            nextButton.addEventListener("click", () => {
              tabMenu.scrollBy({ left: scrollAmount, behavior: "smooth" });
              setTimeout(() => {
                updateScrollState();
              }, 300);
            });
            nextButton.dataset.scrollHandlerAttached = "true";
          }
        }
      }
    };
    checkAndSetupScrolling();
    window.addEventListener("resize", checkAndSetupScrolling);
  }
})();
//# sourceMappingURL=session-tabs.js.map
