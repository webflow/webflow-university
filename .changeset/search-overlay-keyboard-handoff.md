---
'scripts': minor
---

Keep the custom search launcher covering the page until Swiftype's native results overlay is visible, and preserve the scrollbar gutter while search is open to prevent horizontal page shifts. Enable Swiftype's native arrow-key navigation on that overlay by wiring `.st-search-keyboard-navigable`, keep the highlighted result in view while navigating, restore keyboard shortcut help beneath Popular and autocomplete Suggestions, and trap Tab on the active autocomplete input so Swiftype cannot dismiss Suggestions while leaving the launcher open.
