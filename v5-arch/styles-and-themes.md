# Styles and Themes

## Design Architecture and Philosophy

### Core Principle: Configuration Knobs, Not Enumerated Values

The styling system is built around a single unified theme expressed entirely as CSS custom properties ("design tokens"). Rather than hardcoding visual values in component styles, every visual attribute — fonts, sizes, colors, borders, shading, shadows, text decoration thickness, motion timing, etc. — is expressed as a named token that can be overridden at any scope.

This means:
- Switching themes requires only redefining token values, not touching component styles
- Scoped overrides (e.g., a "glass" surface inside a "flat" page) compose naturally via CSS cascade
- Components reference only semantic tokens, never raw values

Layout is explicitly excluded from this system. Layout tokens (gap, padding, grid columns) interact with the box model in ways that don't compose as cleanly as visual tokens, and are better handled separately.

---

### Token Layers

Tokens are organized in three layers:

```
Primitives (raw values, private)
    ↓
Semantic tokens (role-named, public API)
    ↓
Theme trait presets (correlated bundles, override semantics)
```

**Primitives** are raw values that are never referenced directly by components. They are prefixed with `--_` to signal they are private:

```css
:root {
  --_blue-6: oklch(55% 0.2 250);
  --_space-4: 1rem;
}
```

**Semantic tokens** are named by *role*, not by value. Components reference only this layer:

```css
:root {
  --color-interactive: var(--_blue-6);
  --radius-control: 8px;
  --duration-transition: 200ms;
  --easing-transition: ease-out;
  --shadow-resting: 0 1px 3px rgb(0 0 0 / 0.12);
  --shadow-raised: 0 4px 12px rgb(0 0 0 / 0.15);
}
```

**Theme trait presets** bundle correlated tokens that should change together.

---

### Theme Trait Axes: A General Mechanism, Not a Single Attribute

`data-theme` is the base, most general trait axis (luminance/brand identity: `light`/`dark`/`auto`). But the same underlying mechanism — an attribute with enumerated values, each of which overrides a *correlated bundle* of tokens — applies to several other independent concerns as well. Rather than invent unrelated attribute names for each concern, every trait axis is namespaced under `data-theme-*`:

| Attribute | Axis | Example values |
|---|---|---|
| `data-theme` | Luminance / brand identity (the base axis) | `light`, `dark`, `auto` |
| `data-theme-physics` | "Feel"/motion character (inspired by [The Three Physics of UI](https://dimonb19a.hashnode.dev/the-three-physics-of-ui)) | `glass`, `flat`, `retro` |
| `data-theme-contrast` | Accessibility contrast level | `normal`, `high` |

Because these are **independent attributes**, they compose freely via the cascade without any combinatorial explosion of preset names — e.g. `data-theme="dark" data-theme-physics="glass" data-theme-contrast="high"` can all be active on the same subtree simultaneously, each contributing its own token overrides. This also leaves room to add further axes later (e.g. a `data-theme-density` for spacing/compactness) using the exact same mechanism, without touching the ones that already exist.

The key insight behind *every* trait axis: bundling *correlated* tokens prevents incoherent combinations (e.g., a "glass" shadow with "retro" instant transitions, or a "high contrast" override that only raises border opacity but forgets surface separation).

#### `data-theme-physics` example

```css
[data-theme-physics='glass'] {
  --radius-control: 12px;
  --duration-transition: 300ms;
  --easing-transition: cubic-bezier(0.34, 1.56, 0.64, 1); /* springy */
  --shadow-raised: 0 8px 28px -4px var(--shadow-tint), 0 0 12px var(--glow);
}

[data-theme-physics='flat'] {
  --radius-control: 12px;
  --duration-transition: 130ms;
  --easing-transition: cubic-bezier(0.22, 0.61, 0.36, 1); /* quick, no overshoot */
  --shadow-raised: 0 4px 12px rgb(0 0 0 / 0.1);
}

[data-theme-physics='retro'] {
  --radius-control: 0;
  --duration-transition: 0ms;
  --easing-transition: steps(2);
  --shadow-raised: 3px 3px 0 var(--accent-dim);
}
```

#### `data-theme-contrast` example

A naive implementation of `data-theme-contrast='high'` might try to set `--surface-delta-l` and `--border-delta-alpha` to fixed override values directly. But this breaks down as soon as `data-theme` and `data-theme-contrast` need to compose: as the next section shows, `--surface-delta-l` is `-4%` for `light` and `+5%` for `dark` — opposite *signs*, because "elevate" moves in opposite directions in each theme. A single fixed override value for `high` contrast would be correct for one theme's direction and backwards for the other, forcing awkward compound selectors like `[data-theme='light'][data-theme-contrast='high']` and `[data-theme='dark'][data-theme-contrast='high']` — one combinatorial pairing per theme, which defeats the purpose of keeping the axes independent.

The fix is to decompose each delta into a **direction (sign)** — owned by `data-theme` — and a **magnitude** that `data-theme-contrast` can scale, regardless of which direction is active. See [Direction and Magnitude](#direction-and-magnitude-decomposing-the-delta) below for the full token layout. With that decomposition, `data-theme-contrast` becomes a pure multiplier and needs no knowledge of which theme direction is active:

```css
:root {
  --contrast-scale: 1;   /* normal: no change to step magnitudes */
}

[data-theme-contrast='high'] {
  --contrast-scale: 1.5; /* steeper steps, same direction as whatever theme is active */
}
```

`data-theme-contrast='normal'` need not be defined explicitly since `--contrast-scale: 1` is already the root default — it's the default state in the absence of an override.

---

### Generative Tokens: Base + Delta Instead of Enumeration

Rather than explicitly defining every surface level, spacing step, or type size, the system uses a **generative model**: a base value plus a delta (step vector), from which all derived values are calculated via `calc()`.

A "surface level" is not a fixed color — it is a *position along a progression*. The theme defines the base and the step; the surface index selects the position.

#### Surface Elevation Example

```css
:root {
  /* Base surface */
  --surface-base-l: 98%;     /* lightness in oklch */
  --surface-base-c: 0.005;   /* chroma */
  --surface-base-h: 250;     /* hue */

  /* Delta per elevation step */
  --surface-delta-l: -4%;    /* each level gets darker */
  --surface-delta-c: 0.003;  /* slightly more saturated */
  --surface-delta-h: 0;      /* hue stays constant */
}

/* Derived surfaces via calc() */
.surface {
  background: oklch(
    var(--surface-base-l)
    var(--surface-base-c)
    var(--surface-base-h)
  );
}
.surface .surface {
  background: oklch(
    calc(var(--surface-base-l) + var(--surface-delta-l))
    calc(var(--surface-base-c) + var(--surface-delta-c))
    var(--surface-base-h)
  );
}
.surface .surface .surface {
  background: oklch(
    calc(var(--surface-base-l) + 2 * var(--surface-delta-l))
    calc(var(--surface-base-c) + 2 * var(--surface-delta-c))
    var(--surface-base-h)
  );
}
```

A theme switch only redefines `--surface-base-*` and `--surface-delta-*`; all derived surfaces follow automatically.

#### The Delta as a Vector

Each delta is a vector in token space. Different values of `data-theme` can have different delta *directions*:

```css
/* Light theme: surfaces get darker as they elevate */
[data-theme='light'] {
  --surface-base-l: 98%;
  --surface-delta-l: -4%;
  --surface-delta-c: 0.003;   /* warmer as they elevate */
}

/* Dark theme: surfaces get lighter as they elevate */
[data-theme='dark'] {
  --surface-base-l: 8%;
  --surface-delta-l: +5%;
  --surface-delta-c: -0.002;  /* cooler as they elevate */
}
```

Surface components don't change at all — only the base and delta change. Note that a high-contrast override (`data-theme-contrast='high'`, shown above) further adjusts `--surface-delta-l` on top of whatever `data-theme` established — the two axes compose rather than duplicate each other's concerns.

#### Direction and Magnitude: Decomposing the Delta

To make the contrast scale (`--contrast-scale`) work seamlessly across different themes without combinatorial selectors, we decompose each delta into two distinct components:
1. **A direction (sign):** A unitless multiplier (`1` or `-1`) that determines whether the value increases or decreases as elevation/steps progress. This is owned by the theme (e.g., `data-theme`).
2. **A magnitude (scale):** The base step size (e.g., `4%`, `4px`, `0.03`). This is also defined by the theme but can be scaled globally.

The final delta is computed dynamically using `calc()` by multiplying the sign, the base scale, and the global contrast multiplier:

$$\text{Delta} = \text{Sign} \times \text{Scale} \times \text{Contrast Scale}$$

In CSS, this is expressed as:
```css
--surface-delta-l: calc(var(--surface-delta-l-sign) * var(--surface-delta-l-scale) * var(--contrast-scale));
```

##### Complete Token Layout Example

Here is how the decomposed tokens are defined and composed across the `data-theme` and `data-theme-contrast` axes:

```css
:root {
  /* 1. Global Contrast Multiplier (Default: 1) */
  --contrast-scale: 1;

  /* 2. Default/Fallback Decomposed Deltas */
  --surface-delta-l-sign: -1;  /* gets darker */
  --surface-delta-l-scale: 4%; /* 4% lightness steps */

  --surface-delta-c-sign: 1;     /* gets warmer */
  --surface-delta-c-scale: 0.003; /* 0.003 chroma steps */

  --surface-delta-h-sign: 0;
  --surface-delta-h-scale: 0;

  --shadow-delta-blur-sign: 1;   /* shadows always grow */
  --shadow-delta-blur-scale: 4px;

  --shadow-delta-alpha-sign: -1; /* shadows get softer */
  --shadow-delta-alpha-scale: 0.02;

  --border-delta-alpha-sign: 1;  /* borders get more opaque */
  --border-delta-alpha-scale: 0.05;

  /* 3. Generative Delta Calculations */
  --surface-delta-l: calc(
    var(--surface-delta-l-sign) *
    var(--surface-delta-l-scale) *
    var(--contrast-scale)
  );
  --surface-delta-c: calc(
    var(--surface-delta-c-sign) *
    var(--surface-delta-c-scale) *
    var(--contrast-scale)
  );
  --surface-delta-h: calc(
    var(--surface-delta-h-sign) *
    var(--surface-delta-h-scale) *
    var(--contrast-scale)
  );
  --shadow-delta-blur: calc(
    var(--shadow-delta-blur-sign) *
    var(--shadow-delta-blur-scale) *
    var(--contrast-scale)
  );
  --shadow-delta-alpha: calc(
    var(--shadow-delta-alpha-sign) *
    var(--shadow-delta-alpha-scale) *
    var(--contrast-scale)
  );
  --border-delta-alpha: calc(
    var(--border-delta-alpha-sign) *
    var(--border-delta-alpha-scale) *
    var(--contrast-scale)
  );
}

/* --- Theme Trait Axis: Contrast --- */
[data-theme-contrast='high'] {
  --contrast-scale: 1.5; /* Steeper steps across all deltas */
}

/* --- Theme Trait Axis: Luminance --- */

/* Light theme: surfaces get darker as they elevate */
[data-theme='light'] {
  --surface-base-l: 98%;
  --surface-base-c: 0.005;
  --surface-base-h: 250;

  --surface-delta-l-sign: -1;  /* darker */
  --surface-delta-l-scale: 4%;
  --surface-delta-c-sign: 1;   /* warmer */
  --surface-delta-c-scale: 0.003;
}

/* Dark theme: surfaces get lighter as they elevate */
[data-theme='dark'] {
  --surface-base-l: 8%;
  --surface-base-c: 0.02;
  --surface-base-h: 250;

  --surface-delta-l-sign: 1;   /* lighter */
  --surface-delta-l-scale: 5%;
  --surface-delta-c-sign: -1;  /* cooler */
  --surface-delta-c-scale: 0.002;
}
```

##### Benefits of Decomposition

- **Zero Combinatorial Selectors:** We do not need complex selectors like `[data-theme='dark'][data-theme-contrast='high']`. The contrast axis remains completely independent of the luminance axis.
- **Granular Control:** If a specific theme needs to override a delta's base magnitude or direction, it can do so by redefining `--*-scale` or `--*-sign` without breaking the contrast scaling.
- **Unified Scaling:** A single `--contrast-scale` multiplier scales all visual progressions (color, shadows, borders) proportionally, ensuring visual harmony.

#### Generative Patterns by Attribute

| Attribute | Base token | Delta token | CSS mechanism |
|---|---|---|---|
| Surface color | `--surface-base-l` | `--surface-delta-l` | `oklch(calc(...))` |
| Shadow blur | `--shadow-base-blur` | `--shadow-delta-blur` | `calc(base + n*delta)` |
| Shadow opacity | `--shadow-base-alpha` | `--shadow-delta-alpha` | `rgb(0 0 0 / calc(...))` |
| Border opacity | `--border-base-alpha` | `--border-delta-alpha` | `rgb(0 0 0 / calc(...))` |
| Font size scale | `--type-base-size` | `--type-scale-ratio` | `calc(base * ratio^n)` |

For multiplicative scales (like typographic size using a ratio), the powers can be pre-computed as tokens at build time, or expressed using CSS `exp()` and `log()` in modern browsers.

#### Where Generative Tokens Work Best

- Elevation/surface stacking (linear deltas in color space)
- Typographic scales (geometric ratios)
- Spacing scales (linear or geometric)
- Shadow progression (blur, spread, opacity all scale with elevation)
- Border opacity progression

#### Where Enumeration Is Still Appropriate

- Non-monotonic progressions (e.g., a palette that peaks in saturation at step 5 then drops)
- Multi-axis deltas that interact non-linearly
- Trait presets (e.g. `data-theme-physics`, `data-theme-contrast`) that need to override the delta itself, not just the base or a single leaf token

In the last case, a trait preset can override the *delta* tokens too — which is still far more compact than enumerating every surface for every combination of trait values. Not every trait axis needs base+delta, though: some (like `data-theme-physics`) mostly override leaf semantic tokens directly (e.g. `--easing-transition`), only reaching into the delta layer when a preset needs to reshape an entire progression (e.g. widening the shadow-blur progression for `glass`). Whether a given trait preset overrides a leaf token, a delta token, a base token, or some combination, is a decision made per-preset based on what it needs to affect — the mechanism supports all three, it does not mandate base+delta universally.

---

### Full Architecture Summary

```
Primitives (raw values, --_ prefix, never referenced by components)
    ↓
Base + Delta tokens (generative layer, defines progressions)
    ↓
Derived tokens via calc() (surface 1, surface 2, type-lg, ...)
    ↓
Theme trait presets (data-theme, data-theme-physics, data-theme-contrast, ...
                      each overrides leaf, delta, and/or base tokens as needed)
    ↓
Components (reference only derived/semantic tokens)
```

A new theme only needs to specify the *generative parameters* (base + delta), not every derived value. The number of tokens a theme author must define stays small even as the number of derived values grows. Additional trait axes (physics, contrast, and any future axis) plug into the same layered mechanism without requiring changes to how components consume tokens.

# Update: Some Key Design Goals

- Personal users want to be able to express their personality and individuality; businesses want to be able to express their brand identity.
  - They should be able to provide primary, secondary, and tertiary key "brand" colors (like Material Design).
  - Other shades should be calculated from these automatically.
  - They should be able to provide preferred font families by role.
  - They should be able to specify settings for both a light theme and a dark theme, and a preference for light, dark, or automatic (system-based) selection.
- Automatic handling of nested content layers (i.e. via document structure) is desirable.
- Accessibility is a primary concern.
- Semantic components should enforce e.g. WCAG 2.1 AA.
- Ultimately, the content needs to be accessible to the viewer, so they must be able to override provider settings.
  - Force light theme, dark theme, automatic selection, high contrast, specific color/font/size/other overrides, etc.
  - CSS-available preferences should be built-in and automatic.
  - High-contrast override maps onto the `data-theme-contrast` trait axis described above, independent of the light/dark/auto selection made via `data-theme`.
- Where practical, variants should be based on classes, rather than additional attributes.
- Non-namespaced attributes (e.g. `aria-role`) should generally be reserved for alignment with HTML5 standard attributes.
- Namespaced attributes (e.g. `m.`) should generally be used for MWI-specific attributes.
- Lengthy/verbose values should generally be avoided, particularly for ubiquitous values.
  - `pri` for primary, `sec` for secondary, `ter` for tertiary.
