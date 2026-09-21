# MWI Color-System Discussion Summary

## Goal

MWI should use an MD3-inspired color system based on:

- Primary
- Secondary
- Tertiary

Preferably, these colors should be transformed into useful theme colors natively in CSS using `oklch()` and relative-color syntax, rather than requiring a JavaScript/HCT implementation.

The main questions were:

1. Can native CSS generate color variants while still guaranteeing WCAG AA or better contrast?
2. Does MWI need full Material-style tonal palettes with roughly 10–15 steps per color family?
3. What is the real purpose of resource/palette tokens versus semantic/system tokens?
4. Would it be better for MWI to generate only the subset of colors required by its semantic roles?

---

## CSS / OKLCH Capability

Modern CSS is capable of deriving tonal variants from base colors using relative `oklch()` syntax.

Conceptually:

```css
--primary-base: oklch(55% 0.18 260);

--primary-dark:
	oklch(from var(--primary-base) 40% c h);

--primary-light:
	oklch(from var(--primary-base) 90% c h);
```

This provides an MD3-like way to manipulate perceptual lightness while retaining hue and chroma.

HCT and OKLCH are not equivalent color spaces, but they have a similar useful property for theme generation: lightness/tone can be adjusted reasonably independently of hue.

---

## Contrast Guarantees

CSS can support a system designed to guarantee WCAG contrast, but it cannot yet act as a general-purpose contrast solver for arbitrary colors.

CSS cannot currently express logic equivalent to:

```text
Find the nearest tone in this color family that gives at least 4.5:1 contrast with this other color.
```

`contrast-color()` now exists and can choose a contrasting black or white, but it is not a substitute for an MD3-style semantic color system.

Therefore, the better architecture is to define and test specific semantic role pairings such as:

```text
primary             ↔ on-primary
primary-container   ↔ on-primary-container

secondary           ↔ on-secondary
secondary-container ↔ on-secondary-container

tertiary            ↔ on-tertiary
tertiary-container  ↔ on-tertiary-container

surface             ↔ on-surface
```

MWI can choose lightness/chroma formulas for these roles that have been pre-tested over the allowed input-color range.

This means accessibility is guaranteed by the color-role contract rather than by arbitrary runtime contrast calculation.

---

## Gamut and Chroma Considerations

Simply preserving chroma while changing OKLCH lightness is not ideal.

For example:

```css
oklch(from var(--primary-base) 95% c h)
```

may request a chroma that cannot actually exist at that lightness in sRGB or another target gamut.

The browser then has to gamut-map the result.

This makes it unsafe to assume:

```text
known OKLCH L difference == guaranteed WCAG contrast
```

for completely arbitrary base colors.

An HCT-like system deals with this partly by reducing achievable chroma at extreme tones.

MWI could reproduce the useful behavior much more simply by applying chroma scaling factors.

Conceptually:

```css
oklch(
	from var(--primary-base)
	90%
	calc(c * .35)
	h
)
```

The exact factors would need to be experimentally determined and tested.

---

# Palette Tokens vs. Semantic Tokens

The discussion then moved to the purpose of Material-style tonal palettes.

A typical MD3-style generator may produce something resembling:

```text
0
10
20
30
40
50
60
70
80
90
95
99
100
```

for each color family.

These tonal values are primarily an intermediate design resource.

Components generally do not say:

```text
use primary-70
```

Instead, they use semantic roles such as:

```text
primary
on-primary
primary-container
on-primary-container
surface
on-surface
outline
```

The tonal palette provides a pool from which those semantic colors can be selected.

---

## Why Full Tonal Palettes Exist

A complete tonal ramp can still be useful for:

- Theme-building tools
- User-generated/dynamic themes
- Custom components
- Data visualization
- Decorative colors
- State/elevation effects
- Downstream design systems defining additional semantic roles

In those cases, the palette is essentially a raw-material API.

That does not necessarily mean MWI itself needs to expose the entire palette.

---

# Proposed MWI Architecture

Instead of:

```text
primary/secondary/tertiary base colors
        ↓
13-tone palette for each family
        ↓
semantic/system tokens
```

MWI could use:

```text
primary/secondary/tertiary base colors
        ↓
tested OKLCH role formulas
        ↓
only the color resources actually required
        ↓
semantic/system tokens
```

For example, a primary family might internally generate only what is needed for:

```text
primary
on-primary
primary-container
on-primary-container
primary-fixed
primary-fixed-dim
on-primary-fixed
on-primary-fixed-variant
```

There would be no reason to generate `primary-50`, `primary-60`, `primary-70`, etc. unless some defined MWI role actually uses them.

---

## Accessibility Advantage

Restricting the generated palette also improves the accessibility model.

If MWI exposes 13 arbitrary tones per family, developers can easily bypass the semantic contract:

```text
primary-60 text on primary-80 background
```

Such combinations may or may not satisfy contrast requirements.

If MWI instead exposes primarily semantic roles, it can document and guarantee combinations such as:

```text
primary / on-primary
primary-container / on-primary-container
surface / on-surface
```

This makes accessibility part of the interface contract.

---

# Role Recipes Instead of Full Palettes

A particularly attractive approach is to treat each semantic color as a tested recipe.

Conceptually:

| Role | Lightness | Chroma multiplier |
| --- | ---: | ---: |
| primary, light | 0.40 | 1.00 |
| on-primary, light | 1.00 | 0 |
| primary-container, light | 0.90 | 0.35 |
| on-primary-container, light | 0.10 | 0.65 |
| primary, dark | 0.80 | 0.55 |
| on-primary, dark | 0.20 | 0.60 |
| primary-container, dark | 0.30 | 0.85 |
| on-primary-container, dark | 0.90 | 0.35 |

These values were illustrative only, not proposed final values.

MWI could test such formulas across:

- Hue
- Input chroma
- Light/dark themes
- sRGB gamut behavior
- WCAG contrast

The resulting tested formulas would then become part of MWI's theme definition.

---

# Resource Tokens

The emerging distinction was:

## Source tokens

User/theme inputs:

```text
primary-base
secondary-base
tertiary-base
```

Possibly also:

```text
neutral-base
error-base
```

## Resource tokens

Derived colors or other values used as raw materials by the system.

MWI probably does **not** need a comprehensive public resource token for every possible tonal step.

A resource token should ideally exist because the system has a use for it, rather than simply because a palette generator can produce it.

## System / semantic tokens

The actual contractual interface consumed by components:

```text
primary
on-primary
primary-container
on-primary-container

secondary
on-secondary
secondary-container
on-secondary-container

surface
on-surface
outline
...
```

These are the most important abstraction.

---

# Possible Escape Hatch

MWI could still make arbitrary tonal derivation available without defining dozens of permanent palette tokens.

For example, developers needing an unusual tone could directly derive one through the underlying OKLCH formula.

Conceptually:

```css
oklch(
	from var(--m-primary-base)
	var(--desired-lightness)
	calc(c * var(--desired-chroma-factor))
	h
)
```

Thus:

```text
Semantic system:
    constrained and accessibility-tested

Underlying color family:
    mathematically available for advanced/custom use
```

This avoids forcing the full tonal ramp into MWI's public resource-token namespace.

---

# Current Direction

The favored architecture is:

1. Accept primary, secondary, and tertiary source colors (plus neutral and error; possibly information and warning).
2. Use CSS relative `oklch()` to derive colors.
3. Apply tone-dependent chroma reduction where necessary.
4. Generate only the resource colors actually needed by MWI's semantic/system roles.
5. Pre-test the role formulas across the supported input range.
6. Guarantee contrast for documented role pairings rather than arbitrary palette combinations.
7. Avoid exposing a full 10–15-step palette unless concrete use cases arise.
8. Keep arbitrary tonal generation available as an advanced escape hatch if useful.

The central design principle is:

> The tonal palette is primarily implementation/design machinery; the semantic color role is the useful application-facing abstraction.

This also fits MWI's broader preference for exposing a constrained, predictable contractual interface rather than unnecessary implementation detail.
