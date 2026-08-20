# Responsive Header Navigation

- Navigation switches between landscape and portrait mode responsively.
- Over the configurable landscape threshold width (default 800px), landscape mode is used exclusively.
- Below the threshold:
  - Landscape mode is used when the width is greater than or equal to height
  - Portrait mode is used when the height is greater than the width
- Source order (in top-level container):
  - Nav-rail toggle (`<details>`/`<summary>`; visible only in portrait navigation mode)
    - This is strictly a toggle control for the nav rail; *it contains no additional content*
  - Left (logo) slot
  - Navigation slot (links, sub-menus, etc.; fills space)
  - Right slot (for profile opener `<details>`/`<summary>`)
- Landscape mode
  - Nav-rail toggle is not displayed (logo slot displays first)
  - Top-level navigation flex-wrap-displays horizontally in nav slot between logo and right slots
  - Lower-level sub-menus open in full-width trays (cards) below the top-level container
    - These should be absolutely positioned (i.e. not fixed), and scroll together with the header and the rest of the page
  - In this mode, "mega menus" (and any of its sub-menus) should open in a full-width card below, just like other nested sub-menus
- Portrait mode
  - Nav-rail toggle is visible
  - Nav-slot content is hidden completely when the nav-rail opener is closed; it displays in a left-side navigation rail when the nav-rail is open
  - Menu items and regular sub-menus expand in an outline-style accordion
  - The nav rail has a fixed position from top to bottom on the left side
  - The nav-rail toggle is positioned at the top of the nav-rail and does not move
  - The outline-style navigation appears in an `overflow-y: auto` container below the nav-rail toggle (scrolling independently from the main content)
  - In portrait mode, the first "mega menu" opens in a tray (card) to the right of the scrollable portion of the nav-rail
	- This should also be within a (separate) `overflow-y: auto` container
    - Any sub-menus of the "mega menu" open in trays (cards) below it, similar to landscape-mode sub-menus

- `[resNav c.left=[content] c.right=[content] navItems...]`: responsive navigation
  - `c.left` displays on the left side of the header
    - to the left of the top-level menu in landscape mode
	- to the right of the nav-rail opener in portrait mode
	- typically used for logo display
  - nav items fill available horizontal space (`1fr`-style) in landscape mode
  - `c.right` displays on the right side of the header (right-justified)
    - can be used for e.g. profile menu
- `[navLink href=url linkText]`
  - A navigation link with the specified text and URL (similar to `[h.a]`)
  - May support additional, non-link syntax/actions (e.g. open/close/toggle modal) in the future
- `[subMenu l=label content...]`
  - A regular sub-menu with the specified label and content
- `[megaMenu l=label content...]`
  - A mega menu with the specified label and content

## Open/Close Triangles

- Open/close triangles appear next to the label text (separated by a space)
- A mega-menu toggler *within the left nav-rail* shows right-pointing (closed) or left-pointing (open)
  - Does not apply in landscape mode or to sub-mega-menus (which stack vertically, not to the side)
- All other menu labels show down-pointing triangle (closed) and up-pointing triangle (open)

## Notes

- Menu content should be within an internal container for positioning
  - `<details><summary>Label</summary><div><!-- menu content here --></div></details>`
  - Use `m.coat` to compute a level-based `name` attribute for accordion-style exclusion (only one item may be expanded at any given level)
  - Top-level should use `m.coat=[name='@#-x']` (to generate e.g. `name='_MS_1a-x'`)
  - Sub-levels should use `m.coat=[name='<name>-x']` (to generate e.g. `name='_MS_1a-x-x'`, `name='_MS_1a-x-x-x'`, ...)
- Different trays/cards should show different elevations
- Rationale
  - Full-width, horizontal sub-menu trays avoid walking-menu direction issues that might require horizontal scrolling or JS-based "smart positioning"
  - Using a non-floating header ensures that tall menus/expansions on short screens (e.g. a mega-menu open on mobile in landscape) can scroll naturally without issues

## Open Issues

- Identifying the current page - manually? automatically?

# To-Top Button

- A floating action button to appear at a fixed position in the lower right corner of the window
- Display the button when the window is scrolling backward *and* `window.scrollY` is greater than `window.innerHeight`

## Notes

- Unicode symbol options (if we don't go with e.g. SVG)
  - `\u22BC` is caret with line above (current choice)
  - `\u23EB` is a pre-colored "rewind up"
  - `\u21C8` is a side-by-side, double up-arrow
  - `\u219F` is a single, double-headed, up-arrow
- Back-to-top button separate from menu system allows effecient access to navigation without having to float the navigation (e.g. nav appearing on scroll back); user can scroll back slightly to make the button appear, then click the button to return to the header at the top of the page

## Open Issues

- This should be a *button-styled link* (e.g. `#top`), *rather than an actual button*!
