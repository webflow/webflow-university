import { initChecklist } from './common/checklist/index.js';
import { initContrast } from './common/contrast/index.js';
import { initCopyPanels, injectPreviewPanelStyles } from './common/copy-panel/index.js';
import { initGlobalSearch } from './common/global-search/index.js';
import { initSidebar, initSidebarHighlight } from './common/sidebar/index.js';
import { initTheme } from './common/theme/index.js';
import { initCoursesPage } from './courses/index.js';
import { initOnCourseCompleted } from './courses/on-course-completed.js';
import { initDashboardRecommendations } from './dashboard/recommendations.js';
import { initOnboardingGlance } from './pro/onboarding.js';

// Initialize all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTheme();
  initContrast();
  initGlobalSearch();
  initCoursesPage();
  initOnCourseCompleted();
  initChecklist();
  initCopyPanels();
  initOnboardingGlance();
  initDashboardRecommendations();
});

// Initialize sidebar highlight when page loads
initSidebarHighlight();

// Collapse preview panels before first paint
injectPreviewPanelStyles();
