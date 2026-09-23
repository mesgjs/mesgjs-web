# Theme Color Token Tool Proposal

## 1. Overview and Objective

The **MWI Theme Color Token Tool** is a standalone, browser-based web application designed to generate, validate, and export accessible design tokens for MWI themes.

Rather than generating exhaustive 13-step tonal ramps, the tool implements the architecture established in [`v5-arch/color-system-discussion.md`](v5-arch/color-system-discussion.md) and [`v5-arch/styles-and-themes.md`](v5-arch/styles-and-themes.md):
- Derives only the semantic and generative tokens required by MWI components.
- Uses perceptual color math (`oklch()` with tone-dependent chroma scaling).
- Evaluates contrast against strict WCAG 2.1 AA (4.5:1) and AAA (7.0:1) requirements for normal/small text after gamut mapping into sRGB.
- Implements the consolidated **two-phase `resnav` pattern** (as proven in [`src/mwi-res-nav.msjs`](src/mwi-res-nav.msjs:42)):
  1. Resolves active modes (`--theme-color-mode`, `--theme-contrast-mode`) on `html` from system media queries (`prefers-color-scheme`, `prefers-contrast`, `forced-colors`) and explicit user overrides (`data-theme`, `data-contrast`).
  2. Applies non-overlapping, non-repeated token definitions via container style queries (`@container theme-cfg style(...)`).
- Exports copy-and-paste-ready CSS custom properties for light, dark, high-contrast (AAA), and forced-colors themes along with metadata for full reproducibility.

---

## 2. System Architecture and File Structure

The tool will reside in `util/color-token-generator/` and operate without backend build dependencies (using ES modules and modern browser CSS/APIs).

```
util/color-token-generator/
├── index.html                  # Accessible Single Page Application shell
├── css/
│   ├── layout.css              # Grid/flex layout, responsive structure
│   ├── controls.css            # Form elements, pickers, preview cards
│   └── tokens.css              # Internal styling tokens for the generator
└── js/
    ├── main.esm.js             # UI orchestrator, event dispatching, DOM sync
    ├── color-engine.esm.js     # OKLCH/sRGB transforms, gamut clipping, WCAG contrast
    ├── role-recipes.esm.js     # Token recipe formulas per color family & theme
    ├── token-exporter.esm.js   # CSS & JSON export formatters, metadata serializer
    └── hugh-bridge.esm.js      # Integration wrapper for the Hugh color picker
```

### Module Responsibilities

1. **[`util/color-token-generator/js/color-engine.esm.js`](util/color-token-generator/js/color-engine.esm.js)**:
   - Implements color space conversions: `OKLCH ↔ OKLab ↔ Linear sRGB ↔ sRGB (gamma)`.
   - Performs sRGB gamut clipping and boundary checking.
   - Computes exact sRGB relative luminance ($Y = 0.2126R + 0.7152G + 0.0722B$).
   - Calculates contrast ratio $(L_1 + 0.05) / (L_2 + 0.05)$ and assesses WCAG AA ($\ge 4.5$) and AAA ($\ge 7.0$) conformance.

2. **[`util/color-token-generator/js/role-recipes.esm.js`](util/color-token-generator/js/role-recipes.esm.js)**:
   - Defines target lightness ($L$), chroma multipliers ($c \times factor$), and fallback shifts for each semantic role across `light`, `dark`, and `high-contrast` (AAA) modes.
   - Handles chromatic families (`primary`, `secondary`, `tertiary`, `success`, `info`, `warning`, `error`).
   - Handles the generative surface and neutral roles (`surface-base`, `surface-delta-l-sign`, `surface-delta-l-scale`, `outline`, `on-surface`, etc.).
   - Provides high-contrast variant collapse recipes and forced-colors system token mappings.

3. **[`util/color-token-generator/js/hugh-bridge.esm.js`](util/color-token-generator/js/hugh-bridge.esm.js)**:
   - Loads the Hugh color picker directly from the CDN (`https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/hugh.esm.js`). *(Note: `resources/hugh` is an unofficial, informational local development resource only and is never referenced by production code).*
   - Bi-directionally syncs Hugh's OKLCH output with the generator state.

4. **[`util/color-token-generator/js/token-exporter.esm.js`](util/color-token-generator/js/token-exporter.esm.js)**:
   - Formats Phase 1 State Resolution CSS (`html`/`:root` container and custom mode variables).
   - Formats Phase 2 token blocks using `@container theme-cfg style(...)` for decoupled color modes (`light`, `dark`) and orthogonal contrast modes (`high`, `forced`).
   - Generates reproduction headers (CSS comments with input parameters).
   - Generates JSON state configuration blocks for saving and restoring themes.

---

## 3. Supported Color Families and Starting Defaults

The generator provides a dropdown selector for the target color family. Selecting a family loads a curated, accessible starting color (inspired by MD3 / standard design baselines):

| Family Identifier | Role Key | Default Base Color (`oklch`) | Default Hex | Notes |
|---|---|---|---|---|
| `primary` | `pri` | `oklch(0.55 0.18 260)` | `#3454D1` | Core brand identity |
| `secondary` | `sec` | `oklch(0.60 0.12 210)` | `#007A99` | Supporting accent |
| `tertiary` | `ter` | `oklch(0.65 0.14 150)` | `#00825A` | Contrasting accent / balance |
| `neutral` | `neu` | `oklch(0.55 0.02 260)` | `#6E717E` | Surfaces, text, borders |
| `success` | `suc` | `oklch(0.62 0.17 142)` | `#1B873F` | Confirmations, success states |
| `info` | `inf` | `oklch(0.58 0.16 235)` | `#0077B6` | Informational callouts |
| `warning` | `war` | `oklch(0.72 0.16 75)` | `#C06A00` | Cautions, warnings |
| `error` | `err` | `oklch(0.55 0.22 25)` | `#BA1A1A` | Critical alerts, errors |

Users can freely adjust or override the base input color at any time via the Hugh picker, textual OKLCH input, or hex input.

---

## 4. Semantic Role Recipes and Token Schemas

### 4.1 Chromatic Families (`primary`, `secondary`, `tertiary`, `success`, `info`, `warning`, `error`)

For a chromatic family `$ROLE` (e.g., `primary`), the tool produces paired tokens ensuring contrast:

| Token Name | Light Theme Recipe ($L$, $C$) | Dark Theme Recipe ($L$, $C$) | Contrast Partner | Target Ratio |
|---|---|---|---|---|
| `--color-$ROLE` | $L \approx 0.40, C \times 1.0$ | $L \approx 0.80, C \times 0.65$ | `--color-on-$ROLE` | $\ge 4.5:1$ (AA), $\ge 7.0:1$ (AAA) |
| `--color-on-$ROLE` | $L \approx 0.99, C \times 0.0$ | $L \approx 0.15, C \times 0.50$ | `--color-$ROLE` | $\ge 4.5:1$ (AA), $\ge 7.0:1$ (AAA) |
| `--color-$ROLE-container` | $L \approx 0.90, C \times 0.35$ | $L \approx 0.30, C \times 0.70$ | `--color-on-$ROLE-container` | $\ge 4.5:1$ (AA) |
| `--color-on-$ROLE-container` | $L \approx 0.12, C \times 0.65$ | $L \approx 0.92, C \times 0.30$ | `--color-$ROLE-container` | $\ge 4.5:1$ (AA) |
| `--color-$ROLE-fixed` | $L \approx 0.90, C \times 0.40$ | $L \approx 0.90, C \times 0.40$ | `--color-on-$ROLE-fixed` | $\ge 4.5:1$ (AA) |
| `--color-$ROLE-fixed-dim` | $L \approx 0.82, C \times 0.45$ | $L \approx 0.82, C \times 0.45$ | `--color-on-$ROLE-fixed` | $\ge 4.5:1$ (AA) |
| `--color-on-$ROLE-fixed` | $L \approx 0.10, C \times 0.60$ | $L \approx 0.10, C \times 0.60$ | `--color-$ROLE-fixed` | $\ge 4.5:1$ (AA) |
| `--color-on-$ROLE-fixed-variant` | $L \approx 0.28, C \times 0.50$ | $L \approx 0.28, C \times 0.50$ | `--color-$ROLE-fixed` | $\ge 4.5:1$ (AA) |

### 4.2 Neutral Family (`neutral`)

The neutral family drives the surface elevation model and typography foundations as defined in [`v5-arch/styles-and-themes.md`](v5-arch/styles-and-themes.md):

| Token Name | Light Theme Definition | Dark Theme Definition | Purpose |
|---|---|---|---|
| `--surface-base-l` | `98%` | `8%` | Lightness base |
| `--surface-base-c` | `0.005` | `0.020` | Subtle tint chroma |
| `--surface-base-h` | Derived from hue $h$ | Derived from hue $h$ | Tint hue |
| `--surface-delta-l-sign` | `-1` | `1` | Darker on rise vs lighter on rise |
| `--surface-delta-l-scale` | `4%` | `5%` | Step magnitude per elevation |
| `--surface-delta-c-sign` | `1` | `-1` | Chroma shift direction |
| `--surface-delta-c-scale` | `0.003` | `0.002` | Chroma shift magnitude |
| `--color-on-surface` | `oklch(0.12 c*0.1 h)` | `oklch(0.92 c*0.1 h)` | High contrast body text |
| `--color-on-surface-variant` | `oklch(0.35 c*0.2 h)` | `oklch(0.75 c*0.2 h)` | Secondary / caption text |
| `--color-outline` | `oklch(0.50 c*0.2 h)` | `oklch(0.55 c*0.2 h)` | Component borders / dividers |
| `--color-outline-variant` | `oklch(0.80 c*0.1 h)` | `oklch(0.30 c*0.1 h)` | Subtle dividers |
| `--color-inverse-surface` | `oklch(0.18 c*0.1 h)` | `oklch(0.90 c*0.1 h)` | Snackbars / inverse regions |
| `--color-inverse-on-surface` | `oklch(0.95 c*0.05 h)` | `oklch(0.12 c*0.05 h)` | Inverse text |

---

## 5. Gamut Clipping & Contrast Compliance Engine

### 5.1 sRGB Gamut Verification & Clipping
Modern displays support wide gamuts (Display P3), but Web accessibility standards require WCAG compliance in standard sRGB.
1. Target OKLCH values are mapped to linear sRGB.
2. If RGB channels fall outside $[0.0, 1.0]$, clipping is applied to determine real-world displayed sRGB color.
3. The gamut warning indicator highlights if clipping altered the tone or chroma significantly.

### 5.2 Strict WCAG Contrast Calculation
Relative luminance $Y$ is calculated per WCAG 2.1 specifications:
$$Y = 0.2126 R_{\text{lin}} + 0.7152 G_{\text{lin}} + 0.0722 B_{\text{lin}}$$
$$\text{Contrast Ratio} = \frac{\max(Y_1, Y_2) + 0.05}{\min(Y_1, Y_2) + 0.05}$$

**Compliance Reporting:**
- Strict evaluation based on **normal/small text** standards:
  - **WCAG AA Pass**: $\ge 4.5:1$
  - **WCAG AAA Pass**: $\ge 7.0:1$
  - **Fail**: $< 4.5:1$
- The UI highlights exact contrast ratios on each token pairing swatch. If a custom input causes a ratio to dip below 4.5:1, a visual badge and accessible alert are triggered, offering an auto-nudge button to restore compliance.

---

## 6. Output Formats and Reproducibility

The tool provides an output pane with three synchronized formats:

### 6.1 Two-Phase Consolidated CSS Custom Properties (Light, Dark, Contrast & Forced Colors)
```css
/* ==========================================================================
   MWI Theme Tokens: Primary
   Source: oklch(55% 0.18 260) | Gamut: sRGB OK | Generator v1.0
   Reproduce: {"family":"primary","base":"oklch(0.55 0.18 260)"}
   ========================================================================== */

/* --------------------------------------------------------------------------
   Phase 1: State Resolution (Media Queries + Attribute Overrides on html)
   -------------------------------------------------------------------------- */
html {
  /* container-name: theme-cfg; /* (aggregate) */
  color-scheme: light dark;

  /* Baseline mode defaults */
  --theme-color-mode: light;
  --theme-contrast-mode: standard;

  /* Base/primitive theme inputs */
  --m-primary-base: oklch(55% 0.18 260);
}

/* System Preference Defaults via Standard Cascade */
@media (prefers-color-scheme: dark) {
  html { --theme-color-mode: dark; }
}

@media (prefers-contrast: more) {
  html { --theme-contrast-mode: high; }
}

@media (forced-colors: active) {
  html { --theme-contrast-mode: forced; }
}

/* Explicit User Overrides via Standard Cascade Rules (Specificity/Ordering) */
html[data-theme='light']          { --theme-color-mode: light; }
html[data-theme='dark']           { --theme-color-mode: dark; }

html[data-contrast='standard']    { --theme-contrast-mode: standard; }
html[data-contrast='more'],
html[data-contrast='high']        { --theme-contrast-mode: high; }

/* --------------------------------------------------------------------------
   Phase 2: Consolidated Non-Overlapping Token Blocks on body
   (Since theme configuration uses container queries on :root/html, style
   settings not required on html are applied to body instead)
   -------------------------------------------------------------------------- */

/* Base Light Mode Tokens */
@container theme-cfg style(--theme-color-mode: light) {
  body {
    --color-primary: oklch(40% 0.18 260);
    --color-on-primary: oklch(99% 0 0);
    --color-primary-container: oklch(90% 0.063 260);
    --color-on-primary-container: oklch(12% 0.117 260);
    --color-primary-fixed: oklch(90% 0.072 260);
    --color-primary-fixed-dim: oklch(82% 0.081 260);
    --color-on-primary-fixed: oklch(10% 0.108 260);
    --color-on-primary-fixed-variant: oklch(28% 0.090 260);
    --color-outline: oklch(50% 0.036 260);
    --color-on-surface-variant: oklch(35% 0.036 260);
  }
}

/* Base Dark Mode Tokens */
@container theme-cfg style(--theme-color-mode: dark) {
  body {
    --color-primary: oklch(80% 0.117 260);
    --color-on-primary: oklch(15% 0.090 260);
    --color-primary-container: oklch(30% 0.126 260);
    --color-on-primary-container: oklch(92% 0.054 260);
    --color-primary-fixed: oklch(90% 0.072 260);
    --color-primary-fixed-dim: oklch(82% 0.081 260);
    --color-on-primary-fixed: oklch(10% 0.108 260);
    --color-on-primary-fixed-variant: oklch(28% 0.090 260);
    --color-outline: oklch(55% 0.036 260);
    --color-on-surface-variant: oklch(75% 0.036 260);
  }
}

/* Orthogonal High-Contrast (WCAG AAA) Layer */
@container theme-cfg style(--theme-contrast-mode: high) {
  body {
    --color-on-surface-variant: var(--color-on-surface);
    --color-outline: var(--color-on-surface);
  }
}

/* Orthogonal Windows High Contrast Mode (Forced Colors) Layer */
@container theme-cfg style(--theme-contrast-mode: forced) {
  body {
    --color-primary: Highlight;
    --color-on-primary: HighlightText;
    --color-on-surface: CanvasText;
    --color-outline: ButtonBorder;
  }
}
```

The `container-name` noted here must be documented for inclusion in an application's `[m.stag :root container-name ...]` configuration. Direct inclusion in the CSS could potentially conflict with the `[m.stag]` aggregate value.

### 6.2 JSON Configuration Block
A dedicated JSON tab allows copying or loading configurations:
```json
{
  "version": "1.0",
  "family": "primary",
  "base": {
    "space": "oklch",
    "l": 0.55,
    "c": 0.18,
    "h": 260
  },
  "compliance": {
    "lightPrimaryVsOnPrimary": 8.42,
    "lightContainerVsOnContainer": 6.85,
    "darkPrimaryVsOnPrimary": 9.14,
    "darkContainerVsOnContainer": 7.31
  }
}
```

---

## 7. User Interface & Accessibility Specifications

The generator is designed to be fully accessible per WCAG 2.1 AA:

1. **Semantic DOM & Landmarks**:
   - `<header>`: Tool title, family selection, preset picker.
   - `<main>`: Split layout containing (1) Input & Controls Panel, (2) Live Token Preview Matrix, and (3) Code Export Area.
   - `<section aria-labelledby="...">`: Clearly delimited sections for Light Theme, Dark Theme, and Surface Progression.

2. **Accessible Form Controls & Live Updates**:
   - Explicit `<label>` associations on all inputs.
   - Color picker with keyboard step incrementing (arrows for hue, lightness, chroma).
   - `aria-live="polite"` region announcing contrast ratios and compliance status when colors change.
   - High contrast status badges (e.g. `[AA 7.4:1]` / `[AAA 11.2:1]`) with clear icon and text cues (never color alone).

3. **Interactive Previews**:
   - Live sample cards demonstrating real button, card, chip, text, and container components using generated tokens.
   - Theme toggle switcher (`Light` / `Dark` / `Split`) for instant visual comparison.

---

## 8. Implementation Steps

1. **Step 1: Color Math & Gamut Engine**: Implement [`util/color-token-generator/js/color-engine.esm.js`](util/color-token-generator/js/color-engine.esm.js) with OKLCH, sRGB clipping, relative luminance, and contrast calculations.
2. **Step 2: Role Recipes & Generator Logic**: Implement [`util/color-token-generator/js/role-recipes.esm.js`](util/color-token-generator/js/role-recipes.esm.js) covering chromatic roles and neutral surface progression recipes.
3. **Step 3: Hugh Color Picker Integration**: Implement [`util/color-token-generator/js/hugh-bridge.esm.js`](util/color-token-generator/js/hugh-bridge.esm.js).
4. **Step 4: Token Exporter**: Implement [`util/color-token-generator/js/token-exporter.esm.js`](util/color-token-generator/js/token-exporter.esm.js) for CSS and JSON formatting.
5. **Step 5: UI & Accessible App Shell**: Build [`util/color-token-generator/index.html`](util/color-token-generator/index.html), [`util/color-token-generator/css/layout.css`](util/color-token-generator/css/layout.css), and [`util/color-token-generator/css/controls.css`](util/color-token-generator/css/controls.css).
6. **Step 6: Verification & Test Suite**: Add automated checks verifying contrast compliance across all default presets and edge cases.

---

## 9. Two-Phase Preference & Contrast Architecture

### 9.1 ResNav Consolidation Model

Rather than generating combinatorial CSS selectors (e.g. `html[data-theme="dark"][data-contrast="more"]`, `@media (prefers-color-scheme: dark) and (prefers-contrast: more)`, etc.), the theme token system uses the **two-phase resolution pattern** proven in [`src/mwi-res-nav.msjs`](src/mwi-res-nav.msjs:42):

1. **Phase 1 (State Resolution)**: Resolves the active mode variables on `html` (`--theme-color-mode: light|dark` and `--theme-contrast-mode: standard|high|forced`).
   - Base defaults are driven by standard OS queries: [`@media (prefers-color-scheme)`](v5-arch/theme-color-tool.md:235), [`@media (prefers-contrast: more)`](v5-arch/theme-color-tool.md:244), and [`@media (forced-colors: active)`](v5-arch/theme-color-tool.md:245).
   - Explicit user overrides are attached via root attributes: `html[data-theme="..."]` and `html[data-contrast="..."]`.
2. **Phase 2 (Non-Overlapping Token Application)**: Token definitions query the resolved container state via `@container theme-cfg style(...)`.
   - **Color Axis**: Light and Dark token sets are declared exactly once.
   - **Contrast Axis**: High-contrast (AAA) and Forced Colors layers act orthogonally over whichever color mode is active, collapsing variant tokens or injecting standard CSS system colors (`Canvas`, `CanvasText`, `Highlight`, `ButtonBorder`).

### 9.2 Contrast & Accessibility Compliance

- **WCAG AA vs AAA**:
  - Standard Mode targets WCAG 2.1 AA ($\ge 4.5:1$ for normal text, $\ge 3.0:1$ for containers/large text).
  - High-Contrast Mode targets WCAG AAA ($\ge 7.0:1$), reinforces `--color-outline` contrast, and collapses low-contrast variant tokens (`--color-on-surface-variant` $\rightarrow$ `--color-on-surface`).
- **Windows High Contrast Mode (WHCM)**:
  - Supports `@media (forced-colors: active)` by providing dedicated semantic bindings to CSS System Colors while preserving structural borders.
