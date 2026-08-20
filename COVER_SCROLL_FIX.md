Cover page now scrolls like other pages.

CSS change:
- Removed `justify-content: space-between` from `.cover`
- Changed `.cover-photo` from `flex: 1; min-height: 180px` to fixed `height: 180px; flex: none`

This allows the story cards at the bottom of the cover to push the content taller than the page, enabling the existing vertical scroll gesture (same as city pages).