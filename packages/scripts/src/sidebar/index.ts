document.addEventListener('DOMContentLoaded', function () {
  const sidebar = document.querySelector('.sidebar');
  const mobileMenuBtn = document.getElementById('mobile-menu');
  const mobileMenu = document.querySelector('.sidebar_mobile-wrap');
  const bgCloseDiv = document.getElementById('mobileBgClose');
  sidebar.classList.add('no-transition');

  // Set domain for cookies
  let currentDomain =
    window.location.hostname === 'wfu3.webflow.io' ? 'wfu3.webflow.io' : '.webflow.com';

  // Test to see if cookies are enabled
  function checkCookieEnabled() {
    // Try to set a test cookie
    document.cookie = 'testcookie=1; expires=Wed, 01-Jan-2070 00:00:01 GMT; path=/';

    // Try to get the test cookie
    const isEnabled = document.cookie.indexOf('testcookie') !== -1;

    // Delete the test cookie
    document.cookie = 'testcookie=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/';

    return isEnabled;
  }

  const isCookieEnabled = checkCookieEnabled();

  // Function to get the current sidebarState
  const getSidebarState = () =>
    Cookies.get('wfu-sidebarState') || localStorage.getItem('sidebarState');

  // Function to set the sidebarState
  const setSidebarState = (value) => {
    try {
      Cookies.set('wfu-sidebarState', value, {
        expires: 365,
        domain: currentDomain,
      });
    } catch (e) {
      localStorage.setItem('sidebarState', value);
    }
  };

  // Check if sidebarState is set in local storage
  // if true && cookies are enabled, swap it to use cookies instead
  const localStoragesidebarState = localStorage.getItem('sidebarState');
  if (localStoragesidebarState && isCookieEnabled) {
    setSidebarState(localStoragesidebarState);
    localStorage.removeItem('sidebarState'); // Remove from local storage
  }

  // Check the sidebar state & apply a class of "opened"
  // Set storage if sidebarState is null
  const sidebarState = getSidebarState();

  if (sidebarState === 'opened') {
    sidebar.classList.add('opened');
  } else if (sidebarState === null) {
    sidebar.classList.add('opened');
    setSidebarState('opened');
  }

  document.documentElement.style.visibility = '';

  setTimeout(function () {
    sidebar.classList.remove('no-transition');
  }, 350);

  setTimeout(function () {
    const sidebarItems = document.querySelectorAll(
      '.sidebar .sidebar_link-text, .sidebar .sidebar_title, .sidebar .wf_wordmark'
    );

    const sidebarFooter = document.querySelector('.sidebar_footer');

    sidebarItems.forEach((item) => {
      item.style.transition =
        'opacity 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), visibility 0.01s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), max-height 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), margin 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';
    });

    sidebarFooter.style.transition =
      'width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), height 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';
  }, 10);

  // Function to toggle sidebar state
  function toggleSidebar() {
    // Temporarily disable transitions for overflow hidden
    sidebar.style.transition = 'none';

    // Set overflow to hidden before minimizing
    sidebar.style.overflow = 'hidden';

    // Force a reflow to make sure the above styles are applied before proceeding
    // This ensures that your transitions are applied smoothly.
    void sidebar.offsetWidth;

    // Re-enable transitions
    sidebar.style.transition = 'width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';

    // Toggle the sidebar
    sidebar.classList.toggle('opened');

    // Save the sidebarState
    if (sidebar.classList.contains('opened')) {
      setSidebarState('opened');
    } else {
      setSidebarState('minimized');
    }

    // Remove the overflow hidden after a delay to allow the animation to complete
    setTimeout(() => {
      sidebar.style.overflow = '';
      sidebar.style.transition = '';
    }, 600);
  }

  // Click event to toggle state
  document.getElementById('sidebar-close').addEventListener('click', function () {
    toggleSidebar();
  });

  // Keyboard shortcut (command + /) to toggle state
  document.addEventListener('keydown', function (e) {
    if (e.metaKey && e.key === '/') {
      toggleSidebar();
    }
  });

  // Minimize sidebar when viewport gets below 1296px
  let resizeTimer;

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const currentSidebarState = getSidebarState();
      if (window.innerWidth < 1296 && currentSidebarState === 'opened') {
        sidebar.style.overflow = 'hidden';
        sidebar.style.transition = 'width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';
        sidebar.classList.remove('opened');

        setTimeout(() => {
          sidebar.style.overflow = '';
          sidebar.style.transition = '';
        }, 600);
      } else if (window.innerWidth > 1296 && currentSidebarState === 'opened') {
        sidebar.style.overflow = 'hidden';
        sidebar.style.transition = 'width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)';
        sidebar.classList.add('opened');

        setTimeout(() => {
          sidebar.style.overflow = '';
          sidebar.style.transition = '';
        }, 600);
      }
    }, 200);
  });

  if (window.innerWidth < 1296 && getSidebarState() === 'opened') {
    sidebar.classList.remove('opened');
  }

  // Mobile Menu

  mobileMenuBtn.addEventListener('click', function () {
    mobileMenu.classList.toggle('opened');
    bgCloseDiv.classList.toggle('opened');
    mobileMenuBtn.classList.toggle('u-bgc-2');

    if (window.innerWidth < 768) {
      if (document.body.style.overflow !== 'hidden') {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  });

  bgCloseDiv.addEventListener('click', function () {
    mobileMenu.classList.remove('opened');
    bgCloseDiv.classList.remove('opened');
    mobileMenuBtn.classList.toggle('u-bgc-2');

    setTimeout(() => {
      window.Webflow && window.Webflow.require('ix2').init();
    }, 250);

    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = 'auto';
    }
  });
});

// Sidebar Highlight - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Wait for the DOM to fully load before running the script
window.onload = function () {
  // Highlight sub directories
  const curUrl = window.location.pathname;
  const anchorTags = document.querySelectorAll('.sidebar_link-group');

  anchorTags.forEach((anchor) => {
    const href = anchor.getAttribute('href');

    if (href === '/' && curUrl === '/') {
      anchor.classList.add('w--current');
    } else if (curUrl.startsWith('/course-lesson/') && href === '/courses') {
      anchor.classList.add('w--current');
    } else if (curUrl.startsWith('/lesson/') && href === '/docs') {
      anchor.classList.add('w--current');
    } else if (href !== '/' && curUrl.indexOf(href) !== -1) {
      anchor.classList.add('w--current');
    } else {
      anchor.classList.remove('w--current');
    }
  });
};

document.addEventListener('DOMContentLoaded', function () {
  // Reference to the desktop theme buttons
  const toLightModeButton = document.getElementById('toLightMode');
  const toDarkModeButton = document.getElementById('toDarkMode');

  // Reference to the mobile theme buttons
  const toLightModeButtonMobile = document.getElementById('toLightModeMobile');
  const toDarkModeButtonMobile = document.getElementById('toDarkModeMobile');

  let currentDomain =
    window.location.hostname === 'wfu3.webflow.io' ? 'wfu3.webflow.io' : '.webflow.com';

  // Test to see if cookies are enabled
  function checkCookieEnabled() {
    // Try to set a test cookie
    document.cookie = 'testcookie=1; expires=Wed, 01-Jan-2070 00:00:01 GMT; path=/';

    // Try to get the test cookie
    const isEnabled = document.cookie.indexOf('testcookie') !== -1;

    // Delete the test cookie
    document.cookie = 'testcookie=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/';

    return isEnabled;
  }

  const isCookieEnabled = checkCookieEnabled();

  // Function to get the current theme
  const getThemeStorage = () => Cookies.get('wfu-theme') || localStorage.getItem('theme');

  // Function to set the theme
  const setThemeStorage = (value) => {
    try {
      Cookies.set('wfu-theme', value, {
        expires: 365,
        domain: currentDomain,
      });
    } catch (e) {
      localStorage.setItem('theme', value);
    }
  };

  // Check if Theme is set in local storage
  // if true && cookies are enabled, swap it to use cookies instead
  const localStorageTheme = localStorage.getItem('theme');
  if (localStorageTheme && isCookieEnabled) {
    setThemeStorage(localStorageTheme);
    localStorage.removeItem('theme'); // Remove from local storage
  }

  const updateButtons = (theme) => {
    const screenWidth = window.innerWidth;

    // For desktop
    if (screenWidth > 768) {
      if (theme === 'light') {
        toDarkModeButton.style.display = 'flex';
        toDarkModeButtonMobile.style.display = 'flex';
        toLightModeButton.style.display = 'none';
        toLightModeButtonMobile.style.display = 'none';
      } else {
        toDarkModeButton.style.display = 'none';
        toDarkModeButtonMobile.style.display = 'none';
        toLightModeButton.style.display = 'flex';
        toLightModeButtonMobile.style.display = 'flex';
      }
    }
    // For mobile
    else {
      if (theme === 'light') {
        toDarkModeButtonMobile.style.display = 'flex';
        toLightModeButtonMobile.style.display = 'none';
      } else {
        toDarkModeButtonMobile.style.display = 'none';
        toLightModeButtonMobile.style.display = 'flex';
      }
      toDarkModeButton.style.display = 'none';
      toLightModeButton.style.display = 'none';
    }
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    setThemeStorage(theme);
    updateButtons(theme);
  };

  // Function to handle theme click events
  const handleThemeClick = (element, theme) => {
    element.addEventListener('click', () => {
      setTimeout(() => {
        setTheme(theme);
      }, 380);
    });
  };

  const attachListeners = () => {
    handleThemeClick(toLightModeButton, 'light');
    handleThemeClick(toDarkModeButton, 'dark');
    handleThemeClick(toLightModeButtonMobile, 'light');
    handleThemeClick(toDarkModeButtonMobile, 'dark');
  };

  // Initialize
  setTheme(getThemeStorage() || 'dark');
  attachListeners();

  // Listen for resize changes & update buttons accordingly
  window.addEventListener('resize', () => {
    const currentTheme = getThemeStorage() || 'dark';
    updateButtons(currentTheme);
  });
});

document.addEventListener('DOMContentLoaded', function () {
  // Reference the contrast toggle buttons
  const toggleContrastButtons = document.querySelectorAll('.toggle-contrast');
  const toggleContrastCheckbox = document.getElementById('toggleContrastCheckbox');

  // Set domain for cookies
  let currentDomain =
    window.location.hostname === 'wfu3.webflow.io' ? 'wfu3.webflow.io' : '.webflow.com';

  // Test to see if cookies are enabled
  function checkCookieEnabled() {
    // Try to set a test cookie
    document.cookie = 'testcookie=1; expires=Wed, 01-Jan-2070 00:00:01 GMT; path=/';

    // Try to get the test cookie
    const isEnabled = document.cookie.indexOf('testcookie') !== -1;

    // Delete the test cookie
    document.cookie = 'testcookie=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/';

    return isEnabled;
  }

  const isCookieEnabled = checkCookieEnabled();

  // Function to get the current contrast
  const getContrastStorage = () => Cookies.get('wfu-contrast') || localStorage.getItem('contrast');

  // Function to set the contrast
  const setContrastStorage = (value) => {
    try {
      Cookies.set('wfu-contrast', value, {
        expires: 365,
        domain: currentDomain,
      });
    } catch (e) {
      localStorage.setItem('contrast', value);
    }
  };

  // Check if contrast is set in local storage
  // if true && cookies are enabled, swap it to use cookies instead
  const localStorageContrast = localStorage.getItem('contrast');
  if (localStorageContrast && isCookieEnabled) {
    setContrastStorage(localStorageContrast);
    localStorage.removeItem('contrast');
  }

  const setContrast = (contrast) => {
    document.documentElement.setAttribute('data-contrast', contrast);
    setContrastStorage(contrast);

    if (!toggleContrastCheckbox) return;
    const checkboxInput = toggleContrastCheckbox.previousElementSibling;

    if (contrast === 'high') {
      checkboxInput.classList.add('w--redirected-checked', 'w--redirected-focus');
    } else {
      checkboxInput.classList.remove('w--redirected-checked', 'w--redirected-focus');
    }
  };

  const toggleContrast = () => {
    const currentContrast = getContrastStorage() || 'default';
    // Change contrast to the opposite of current
    const newContrast = currentContrast === 'default' ? 'high' : 'default';
    setContrast(newContrast);

    // Update checkbox based on new contrast value
    if (toggleContrastCheckbox) {
      toggleContrastCheckbox.checked = newContrast === 'high';
    }
  };

  // Intialize
  const savedContrast = getContrastStorage() || 'default';
  setContrast(savedContrast);

  if (toggleContrastCheckbox) {
    toggleContrastCheckbox.checked = savedContrast === 'high';
  }

  toggleContrastButtons.forEach((button) => {
    button.addEventListener('click', toggleContrast);
  });

  // Event listener for the checkbox
  if (toggleContrastCheckbox) {
    toggleContrastCheckbox.addEventListener('change', function (e) {
      // Stop any other event listeners from being called
      e.stopImmediatePropagation();

      const contrast = e.target.checked ? 'high' : 'default';
      setContrast(contrast);
    });
  }
});
