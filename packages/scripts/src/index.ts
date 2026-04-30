import { initContrast } from './common/contrast/index.js';
import { initGlobalSearch } from './common/global-search/index.js';
import { initSidebar, initSidebarHighlight } from './common/sidebar/index.js';
import { initTheme } from './common/theme/index.js';

// Initialize all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTheme();
  initContrast();
  initGlobalSearch();
});

// Initialize sidebar highlight when page loads
initSidebarHighlight();
