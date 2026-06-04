import { initTabMenuScrolling } from './session-tabs';

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTabMenuScrolling);
} else {
  initTabMenuScrolling();
}
