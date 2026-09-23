/**
 * @file token-exporter.esm.js
 * Formats generated tokens into CSS Custom Properties and JSON configuration blocks.
 */

import { formatOklch, oklchToSrgb } from './color-engine.esm.js';
import { COLOR_FAMILIES } from './role-recipes.esm.js';

/**
 * Format CSS Tokens for a single chromatic family.
 */
export function formatChromaticCss (generated) {
	const { family, base, light, dark } = generated;
	const familyConfig = COLOR_FAMILIES[family] || { name: family, roleKey: family };
	const baseFormatted = formatOklch(base.l, base.c, base.h, { percent: true });
	const inGamut = oklchToSrgb(base.l, base.c, base.h).inGamut;
	const gamutStatus = inGamut ? 'sRGB OK' : 'Gamut Clipped';

	const reproduceJson = JSON.stringify({
		family,
		base: formatOklch(base.l, base.c, base.h, { percent: false, precision: 4 }),
	});

	const lightTokenLines = Object.values(light)
		.map((t) => `  ${t.name}: ${t.cssValue};`)
		.join('\n');

	const darkTokenLines = Object.values(dark)
		.map((t) => `  ${t.name}: ${t.cssValue};`)
		.join('\n');

	return `/* ==========================================================================
   MWI Theme Tokens: ${familyConfig.name}
   Source: ${baseFormatted} | Gamut: ${gamutStatus} | Generator v1.0
   Reproduce: ${reproduceJson}
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
${lightTokenLines}
  }
}

/* Base Dark Mode Tokens */
@container theme-cfg style(--theme-color-mode: dark) {
  body {
${darkTokenLines}
  }
}

/* Orthogonal Windows High Contrast Mode (Forced Colors) Layer */
@container theme-cfg style(--theme-contrast-mode: forced) {
  body {
    --color-${family}: Highlight;
    --color-on-${family}: HighlightText;
  }
}
`;
}

/**
 * Format CSS Tokens for the Neutral family and generative surface elevation model.
 */
export function formatNeutralCss (generated) {
	const { base, light, dark } = generated;
	const baseFormatted = formatOklch(base.l, base.c, base.h, { percent: true });
	const inGamut = oklchToSrgb(base.l, base.c, base.h).inGamut;
	const gamutStatus = inGamut ? 'sRGB OK' : 'Gamut Clipped';

	const reproduceJson = JSON.stringify({
		family: 'neutral',
		base: formatOklch(base.l, base.c, base.h, { percent: false, precision: 4 }),
	});

	const lightGenLines = Object.entries(light.generative)
		.map(([k, v]) => `  ${k}: ${v};`)
		.join('\n');
	const lightSemLines = Object.values(light.semantic)
		.map((t) => `  ${t.name}: ${t.cssValue};`)
		.join('\n');

	const darkGenLines = Object.entries(dark.generative)
		.map(([k, v]) => `  ${k}: ${v};`)
		.join('\n');
	const darkSemLines = Object.values(dark.semantic)
		.map((t) => `  ${t.name}: ${t.cssValue};`)
		.join('\n');

	return `/* ==========================================================================
   MWI Theme Tokens: Neutral & Generative Surfaces
   Source: ${baseFormatted} | Gamut: ${gamutStatus} | Generator v1.0
   Reproduce: ${reproduceJson}
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
   -------------------------------------------------------------------------- */
body {
  /* Generative Delta Calculations */
  --surface-delta-l: calc(
    var(--surface-delta-l-sign) *
    var(--surface-delta-l-scale) *
    var(--contrast-scale, 1)
  );
  --surface-delta-c: calc(
    var(--surface-delta-c-sign) *
    var(--surface-delta-c-scale) *
    var(--contrast-scale, 1)
  );
}

/* Base Light Mode Tokens */
@container theme-cfg style(--theme-color-mode: light) {
  body {
${lightGenLines}

${lightSemLines}
  }
}

/* Base Dark Mode Tokens */
@container theme-cfg style(--theme-color-mode: dark) {
  body {
${darkGenLines}

${darkSemLines}
  }
}

/* Orthogonal High-Contrast (WCAG AAA) Layer */
@container theme-cfg style(--theme-contrast-mode: high) {
  body {
    --contrast-scale: 1.5;
    --color-on-surface-variant: var(--color-on-surface);
    --color-outline: var(--color-on-surface);
    --color-outline-variant: var(--color-on-surface);
  }
}

/* Orthogonal Windows High Contrast Mode (Forced Colors) Layer */
@container theme-cfg style(--theme-contrast-mode: forced) {
  body {
    --color-on-surface: CanvasText;
    --color-on-surface-variant: CanvasText;
    --color-outline: ButtonBorder;
    --color-outline-variant: ButtonBorder;
    --color-inverse-surface: CanvasText;
    --color-inverse-on-surface: Canvas;
  }
}
`;
}

/**
 * Format JSON Configuration.
 */
export function formatJsonConfig (generated) {
	const complianceObj = {};

	for (const [k, v] of Object.entries(generated.compliance || {})) {
		complianceObj[k] = +v.ratio.toFixed(2);
	}

	const out = {
		version: '1.0',
		family: generated.family,
		base: {
			space: 'oklch',
			l: +generated.base.l.toFixed(4),
			c: +generated.base.c.toFixed(4),
			h: +generated.base.h.toFixed(2),
		},
		compliance: complianceObj,
	};

	return JSON.stringify(out, null, 2);
}
