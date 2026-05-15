"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/utils/storage.ts
  function getCurrentDomain() {
    return window.location.hostname === "wfu3.webflow.io" ? "wfu3.webflow.io" : ".webflow.com";
  }
  function checkCookieEnabled() {
    document.cookie = "testcookie=1; expires=Wed, 01-Jan-2070 00:00:01 GMT; path=/";
    const isEnabled = document.cookie.indexOf("testcookie") !== -1;
    document.cookie = "testcookie=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/";
    return isEnabled;
  }
  var StorageManager = class {
    cookieKey;
    localStorageKey;
    domain;
    cookieEnabled;
    constructor(cookieKey, localStorageKey) {
      this.cookieKey = cookieKey;
      this.localStorageKey = localStorageKey;
      this.domain = getCurrentDomain();
      this.cookieEnabled = checkCookieEnabled();
      this.migrateFromLocalStorage();
    }
    /**
     * Migrates data from localStorage to cookies if cookies are enabled
     */
    migrateFromLocalStorage() {
      const localStorageValue = localStorage.getItem(this.localStorageKey);
      if (localStorageValue && this.cookieEnabled) {
        this.setValue(localStorageValue);
        localStorage.removeItem(this.localStorageKey);
      }
    }
    /**
     * Gets the stored value, checking cookies first, then localStorage
     * @returns The stored value or null if not found
     */
    getValue() {
      if (this.cookieEnabled) {
        const cookieValue = Cookies.get(this.cookieKey);
        if (cookieValue) {
          return cookieValue;
        }
      }
      return localStorage.getItem(this.localStorageKey);
    }
    /**
     * Sets the stored value, using cookies if enabled, otherwise localStorage
     * @param value The value to store
     */
    setValue(value) {
      if (this.cookieEnabled) {
        try {
          Cookies.set(this.cookieKey, value, {
            expires: 365,
            domain: this.domain
          });
        } catch {
          localStorage.setItem(this.localStorageKey, value);
        }
      } else {
        localStorage.setItem(this.localStorageKey, value);
      }
    }
  };

  // src/common/contrast/index.ts
  function initContrast() {
    const toggleContrastButtons = document.querySelectorAll(".toggle-contrast");
    const toggleContrastCheckbox = document.getElementById(
      "toggleContrastCheckbox"
    );
    if (toggleContrastButtons.length === 0) {
      console.warn("Contrast toggle buttons not found");
      return;
    }
    const storage = new StorageManager("wfu-contrast", "contrast");
    const setContrast = (contrast) => {
      document.documentElement.setAttribute("data-contrast", contrast);
      storage.setValue(contrast);
      if (!toggleContrastCheckbox) return;
      const checkboxInput = toggleContrastCheckbox.previousElementSibling;
      if (!checkboxInput) return;
      if (contrast === "high") {
        checkboxInput.classList.add("w--redirected-checked", "w--redirected-focus");
      } else {
        checkboxInput.classList.remove("w--redirected-checked", "w--redirected-focus");
      }
    };
    const toggleContrast = () => {
      const currentContrast = storage.getValue() || "default";
      const newContrast = currentContrast === "default" ? "high" : "default";
      setContrast(newContrast);
      if (toggleContrastCheckbox) {
        toggleContrastCheckbox.checked = newContrast === "high";
      }
    };
    const savedContrast = storage.getValue() || "default";
    setContrast(savedContrast);
    if (toggleContrastCheckbox) {
      toggleContrastCheckbox.checked = savedContrast === "high";
    }
    toggleContrastButtons.forEach((button) => {
      button.addEventListener("click", toggleContrast);
    });
    if (toggleContrastCheckbox) {
      toggleContrastCheckbox.addEventListener("change", (e) => {
        e.stopImmediatePropagation();
        const contrast = e.target.checked ? "high" : "default";
        setContrast(contrast);
      });
    }
  }

  // src/common/global-search/index.ts
  var AUTOCOMPLETE_SELECTOR = ".st-default-autocomplete .st-query-present";
  var SEARCH_RESULT_CONTAINER_SELECTOR = ".st-ui-autocomplete, .st-search-results";
  var SEARCH_RESULT_SELECTOR = ".st-ui-result";
  var MOBILE_WIDTH_THRESHOLD = 768;
  var MOBILE_AUTOCOMPLETE_OFFSET = 150;
  var DESKTOP_AUTOCOMPLETE_OFFSET = 220;
  var SEARCH_RESULT_ICONS = {
    light: {
      default: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a027c452bd908009c354_Search%20icon_Resources-on%20light.svg",
      certificate: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a02006f0f8697b4a4510_Search%20icon_Certs-on%20light.svg",
      lp: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a017d3f67be337ab3655_5ccf5d561cfbcb77e84dcc480461c9bb_Search%20icon_LPs-on%20light.svg",
      video: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a0040f0dcb95415495ce_Search%20icon_Video-on%20light.svg",
      course: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/69989ffc32e80d1b6c3327ed_Search%20icon_Courses-on%20light.svg"
    },
    dark: {
      default: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a02432e80d1b6c33339a_Search%20icon_Resources-on%20dark.svg",
      certificate: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a01ed8cc3f9e020c2859_Search%20icon_Certs-on%20dark.svg",
      lp: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a00b088617f2a66508f2_9705bb42c8b7c48371f757787f813e51_Search%20icon_LPs-on%20dark.svg",
      video: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/6998a0006fdcc10789cd4f87_Search%20icon_Video-on%20dark.svg",
      course: "https://cdn.prod.website-files.com/6491b4dd238fa881faab3d5c/69989ff71c4ca1c4e42d35c0_Search%20icon_Courses-on%20dark.svg"
    }
  };
  var SEARCH_ICON_TYPE_ALIASES = [
    { type: "course", match: /\/courses\//i },
    { type: "video", match: /\/videos?\//i },
    { type: "lp", match: /\/learning-paths?\//i },
    { type: "certificate", match: /\/certifications\//i }
  ];
  function initGlobalSearch() {
    initSearchResultIcons();
    const searchWrapper = document.querySelector(".g_search-wrapper");
    const searchCloseBg = document.querySelector(".g_search-close-bg");
    const searchInput = document.getElementById("g-search");
    if (!searchWrapper || !searchCloseBg || !searchInput) {
      console.warn("Global search elements not found");
      return;
    }
    const adjustMaxHeight = () => {
      const currentOffset = window.innerWidth < MOBILE_WIDTH_THRESHOLD ? MOBILE_AUTOCOMPLETE_OFFSET : DESKTOP_AUTOCOMPLETE_OFFSET;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const adjustedMaxHeight = viewportHeight - currentOffset;
      const autocompleteElement = document.querySelector(AUTOCOMPLETE_SELECTOR);
      if (autocompleteElement) {
        autocompleteElement.style.maxHeight = `${adjustedMaxHeight}px`;
      }
    };
    const toggleSearch = () => {
      searchWrapper.classList.toggle("active");
      document.documentElement.style.overflow = searchWrapper.classList.contains("active") ? "hidden" : "";
      if (searchWrapper.classList.contains("active")) {
        searchInput.focus();
      }
    };
    const closeSearch = () => {
      setTimeout(() => {
        searchWrapper.classList.remove("active");
        document.documentElement.style.overflow = "";
        searchInput.value = "";
        const event = new Event("input", {
          bubbles: true,
          cancelable: true
        });
        searchInput.dispatchEvent(event);
      }, 100);
    };
    document.addEventListener("keydown", (event) => {
      if ((event.key === "k" || event.key === "e") && (event.ctrlKey || event.metaKey) && !searchWrapper.classList.contains("active")) {
        toggleSearch();
      } else if (event.key === "Escape") {
        closeSearch();
      }
    });
    searchWrapper.addEventListener("click", (event) => {
      if (event.target === searchWrapper) {
        toggleSearch();
      }
    });
    document.querySelectorAll(".open-search").forEach((element) => {
      element.addEventListener("click", () => {
        toggleSearch();
      });
    });
    searchCloseBg.addEventListener("click", closeSearch);
    const observer = new MutationObserver((_mutationsList, mutationObserver) => {
      const stCloseBtn = document.querySelector(".st-ui-close-button");
      const stUiOverlay = document.querySelector(".st-ui-overlay");
      const autocompleteElement = document.querySelector(AUTOCOMPLETE_SELECTOR);
      if (stCloseBtn && stUiOverlay) {
        stCloseBtn.addEventListener("click", closeSearch);
        stUiOverlay.addEventListener("click", closeSearch);
      }
      if (autocompleteElement) {
        adjustMaxHeight();
        if (window.visualViewport) {
          window.visualViewport.addEventListener("resize", adjustMaxHeight);
        } else {
          window.addEventListener("resize", adjustMaxHeight);
        }
      }
      if (stCloseBtn && stUiOverlay && autocompleteElement) {
        mutationObserver.disconnect();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function initSearchResultIcons() {
    updateAllSearchResultIcons();
    observeSearchThemeChanges();
    observeSearchResultChanges();
  }
  function getSearchIconTheme() {
    const theme = document.documentElement.dataset.theme;
    return theme === "light" || theme === "dark" ? theme : "dark";
  }
  function getSearchIconTypeFromHref(href) {
    if (!href) {
      return "default";
    }
    for (const entry of SEARCH_ICON_TYPE_ALIASES) {
      if (entry.match.test(href)) {
        return entry.type;
      }
    }
    return "default";
  }
  function setCssUrl(element, url) {
    element.style.backgroundImage = `url("${url}")`;
  }
  function updateSearchResultIcons(container) {
    if (!container) {
      return;
    }
    const themeIcons = SEARCH_RESULT_ICONS[getSearchIconTheme()];
    container.querySelectorAll(".st-ui-thumbnail").forEach((thumbnail) => {
      const anchor = thumbnail.closest("a.st-ui-result");
      const iconType = getSearchIconTypeFromHref(anchor?.getAttribute("href") || null);
      const iconUrl = themeIcons[iconType] || themeIcons.default;
      const image = thumbnail.querySelector("img");
      setCssUrl(thumbnail, iconUrl);
      image?.setAttribute("src", iconUrl);
    });
  }
  function updateAllSearchResultIcons() {
    document.querySelectorAll(SEARCH_RESULT_CONTAINER_SELECTOR).forEach((container) => updateSearchResultIcons(container));
  }
  function observeSearchThemeChanges() {
    const observer = new MutationObserver(() => {
      updateAllSearchResultIcons();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  }
  function observeSearchResultChanges() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "childList") {
          continue;
        }
        const hasRelevantNode = Array.from(mutation.addedNodes).some((node) => {
          if (!(node instanceof Element)) {
            return false;
          }
          return node.matches(`${SEARCH_RESULT_CONTAINER_SELECTOR}, ${SEARCH_RESULT_SELECTOR}`) || Boolean(
            node.querySelector(`${SEARCH_RESULT_CONTAINER_SELECTOR}, ${SEARCH_RESULT_SELECTOR}`)
          );
        });
        if (hasRelevantNode) {
          updateAllSearchResultIcons();
          break;
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // src/common/sidebar/index.ts
  function initSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const mobileMenuBtn = document.getElementById("mobile-menu");
    const mobileMenu = document.querySelector(".sidebar_mobile-wrap");
    const bgCloseDiv = document.getElementById("mobileBgClose");
    if (!sidebar || !mobileMenuBtn || !mobileMenu || !bgCloseDiv) {
      console.warn("Sidebar elements not found");
      return;
    }
    const sidebarElement = sidebar;
    const mobileMenuElement = mobileMenu;
    const mobileMenuBtnElement = mobileMenuBtn;
    const bgCloseDivElement = bgCloseDiv;
    sidebarElement.classList.add("no-transition");
    const storage = new StorageManager("wfu-sidebarState", "sidebarState");
    const sidebarState = storage.getValue();
    if (sidebarState === "opened") {
      sidebarElement.classList.add("opened");
    } else if (sidebarState === null) {
      sidebarElement.classList.add("opened");
      storage.setValue("opened");
    }
    document.documentElement.style.visibility = "";
    setTimeout(() => {
      sidebarElement.classList.remove("no-transition");
    }, 350);
    setTimeout(() => {
      const sidebarItems = document.querySelectorAll(
        ".sidebar .sidebar_link-text, .sidebar .sidebar_title, .sidebar .wf_wordmark"
      );
      const sidebarFooter = document.querySelector(".sidebar_footer");
      sidebarItems.forEach((item) => {
        item.style.transition = "opacity 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), visibility 0.01s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), max-height 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), margin 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)";
      });
      if (sidebarFooter) {
        sidebarFooter.style.transition = "width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), height 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)";
      }
    }, 10);
    function toggleSidebar() {
      sidebarElement.style.transition = "none";
      sidebarElement.style.overflow = "hidden";
      void sidebarElement.offsetWidth;
      sidebarElement.style.transition = "width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)";
      sidebarElement.classList.toggle("opened");
      if (sidebarElement.classList.contains("opened")) {
        storage.setValue("opened");
      } else {
        storage.setValue("minimized");
      }
      setTimeout(() => {
        sidebarElement.style.overflow = "";
        sidebarElement.style.transition = "";
      }, 600);
    }
    const sidebarCloseBtn = document.getElementById("sidebar-close");
    if (sidebarCloseBtn) {
      sidebarCloseBtn.addEventListener("click", () => {
        toggleSidebar();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.metaKey && e.key === "/") {
        toggleSidebar();
      }
    });
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const currentSidebarState = storage.getValue();
        if (window.innerWidth < 1296 && currentSidebarState === "opened") {
          sidebarElement.style.overflow = "hidden";
          sidebarElement.style.transition = "width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)";
          sidebarElement.classList.remove("opened");
          setTimeout(() => {
            sidebarElement.style.overflow = "";
            sidebarElement.style.transition = "";
          }, 600);
        } else if (window.innerWidth > 1296 && currentSidebarState === "opened") {
          sidebarElement.style.overflow = "hidden";
          sidebarElement.style.transition = "width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)";
          sidebarElement.classList.add("opened");
          setTimeout(() => {
            sidebarElement.style.overflow = "";
            sidebarElement.style.transition = "";
          }, 600);
        }
      }, 200);
    });
    if (window.innerWidth < 1296 && storage.getValue() === "opened") {
      sidebarElement.classList.remove("opened");
    }
    mobileMenuBtnElement.addEventListener("click", () => {
      mobileMenuElement.classList.toggle("opened");
      bgCloseDivElement.classList.toggle("opened");
      mobileMenuBtnElement.classList.toggle("u-bgc-2");
      if (window.innerWidth < 768) {
        if (document.body.style.overflow !== "hidden") {
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "auto";
        }
      }
    });
    bgCloseDivElement.addEventListener("click", () => {
      mobileMenuElement.classList.remove("opened");
      bgCloseDivElement.classList.remove("opened");
      mobileMenuBtnElement.classList.toggle("u-bgc-2");
      setTimeout(() => {
        if (window.Webflow?.require) {
          window.Webflow.require("ix2").init();
        }
      }, 250);
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = "auto";
      }
    });
  }
  function initSidebarHighlight() {
    window.addEventListener("load", () => {
      const curUrl = window.location.pathname;
      const anchorTags = document.querySelectorAll(".sidebar_link-group");
      anchorTags.forEach((anchor) => {
        const href = anchor.getAttribute("href");
        if (!href) {
          return;
        }
        if (href === "/" && curUrl === "/") {
          anchor.classList.add("w--current");
        } else if (curUrl.startsWith("/course-lesson/") && href === "/courses") {
          anchor.classList.add("w--current");
        } else if (curUrl.startsWith("/lesson/") && href === "/docs") {
          anchor.classList.add("w--current");
        } else if (href !== "/" && curUrl.indexOf(href) !== -1) {
          anchor.classList.add("w--current");
        } else {
          anchor.classList.remove("w--current");
        }
      });
    });
  }

  // src/common/theme/index.ts
  function initTheme() {
    const toLightModeButton = document.getElementById("toLightMode");
    const toDarkModeButton = document.getElementById("toDarkMode");
    const toLightModeButtonMobile = document.getElementById("toLightModeMobile");
    const toDarkModeButtonMobile = document.getElementById("toDarkModeMobile");
    if (!toLightModeButton || !toDarkModeButton || !toLightModeButtonMobile || !toDarkModeButtonMobile) {
      console.warn("Theme buttons not found");
      return;
    }
    const storage = new StorageManager("wfu-theme", "theme");
    const updateButtons = (theme) => {
      const screenWidth = window.innerWidth;
      if (screenWidth > 768) {
        if (theme === "light") {
          toDarkModeButton.style.display = "flex";
          toDarkModeButtonMobile.style.display = "flex";
          toLightModeButton.style.display = "none";
          toLightModeButtonMobile.style.display = "none";
        } else {
          toDarkModeButton.style.display = "none";
          toDarkModeButtonMobile.style.display = "none";
          toLightModeButton.style.display = "flex";
          toLightModeButtonMobile.style.display = "flex";
        }
      } else {
        if (theme === "light") {
          toDarkModeButtonMobile.style.display = "flex";
          toLightModeButtonMobile.style.display = "none";
        } else {
          toDarkModeButtonMobile.style.display = "none";
          toLightModeButtonMobile.style.display = "flex";
        }
        toDarkModeButton.style.display = "none";
        toLightModeButton.style.display = "none";
      }
    };
    const setTheme = (theme) => {
      document.documentElement.setAttribute("data-theme", theme);
      storage.setValue(theme);
      updateButtons(theme);
    };
    const handleThemeClick = (element, theme) => {
      element.addEventListener("click", () => {
        setTimeout(() => {
          setTheme(theme);
        }, 380);
      });
    };
    const attachListeners = () => {
      handleThemeClick(toLightModeButton, "light");
      handleThemeClick(toDarkModeButton, "dark");
      handleThemeClick(toLightModeButtonMobile, "light");
      handleThemeClick(toDarkModeButtonMobile, "dark");
    };
    const savedTheme = storage.getValue() || "dark";
    setTheme(savedTheme);
    attachListeners();
    window.addEventListener("resize", () => {
      const currentTheme = storage.getValue() || "dark";
      updateButtons(currentTheme);
    });
  }

  // src/courses/index.ts
  var COURSES_PATH = "/courses";
  var COURSE_GRID_VIEW_STORAGE_KEY = "courseGridView";
  function initCoursesPage() {
    if (!isCoursesPage()) {
      return;
    }
    const coursesGrid = document.querySelector(".cc_courses-grid");
    if (!coursesGrid) {
      console.warn("Courses grid not found");
      return;
    }
    setupGridToggle(coursesGrid);
    setupCourseCardStyling(coursesGrid);
  }
  function isCoursesPage(pathname = window.location.pathname) {
    const normalizedPath = pathname.replace(/\/+$/, "") || "/";
    return normalizedPath === COURSES_PATH;
  }
  function setupGridToggle(coursesGrid) {
    const cardsButton = document.getElementById("cardBtn");
    const listButton = document.getElementById("listBtn");
    if (!cardsButton || !listButton) {
      console.error("No cardButton or listButton found");
      return;
    }
    const updateGridClass = (listView, activeButton) => {
      if (listView) {
        coursesGrid.classList.add("list");
        localStorage.setItem(COURSE_GRID_VIEW_STORAGE_KEY, "list");
      } else {
        coursesGrid.classList.remove("list");
        localStorage.setItem(COURSE_GRID_VIEW_STORAGE_KEY, "cards");
      }
      cardsButton.classList.remove("active");
      listButton.classList.remove("active");
      activeButton.classList.add("active");
    };
    cardsButton.addEventListener("click", () => updateGridClass(false, cardsButton));
    listButton.addEventListener("click", () => updateGridClass(true, listButton));
    if (localStorage.getItem(COURSE_GRID_VIEW_STORAGE_KEY) === "list") {
      updateGridClass(true, listButton);
    } else {
      updateGridClass(false, cardsButton);
    }
  }
  function setupCourseCardStyling(coursesGrid) {
    const updateCardStyling = () => {
      const courseCards = coursesGrid.querySelectorAll(".cc_course-card");
      courseCards.forEach((card) => {
        card.style.borderRadius = "";
        card.style.borderBottom = "";
        card.style.borderBottomColor = "";
        card.style.borderBottomStyle = "";
        card.style.borderBottomWidth = "";
      });
      if (courseCards.length === 1) {
        courseCards[0].style.borderRadius = "0.25rem";
        setCourseCardBottomBorder(courseCards[0]);
        return;
      }
      if (courseCards.length > 1) {
        courseCards[0].style.borderRadius = "0.25rem 0.25rem 0 0";
        courseCards[courseCards.length - 1].style.borderRadius = "0 0 0.25rem 0.25rem";
        setCourseCardBottomBorder(courseCards[courseCards.length - 1]);
      }
    };
    const observer = new MutationObserver(updateCardStyling);
    observer.observe(coursesGrid, {
      childList: true,
      subtree: true
    });
    updateCardStyling();
  }
  function setCourseCardBottomBorder(card) {
    card.style.borderBottomWidth = "1px";
    card.style.borderBottomStyle = "solid";
    card.style.borderBottomColor = "var(--theme--t_border-primary)";
  }

  // src/index.ts
  document.addEventListener("DOMContentLoaded", () => {
    initSidebar();
    initTheme();
    initContrast();
    initGlobalSearch();
    initCoursesPage();
  });
  initSidebarHighlight();
})();
//# sourceMappingURL=index.js.map
