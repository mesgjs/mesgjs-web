/**
 * @file token-exporter.esm.js
 * Formats generated tokens into CSS Custom Properties and JSON configuration blocks.
 */

import {
	formatOklch,
	oklchToSrgb,
	rgbToHex,
	parseOklch,
	hexToOklch,
	oklchToHex,
} from './color-engine.esm.js';
import { COLOR_FAMILIES, DEFAULT_BRAND_TUNING } from './role-recipes.esm.js';

/**
 * Format Theme State Configuration CSS (root container setup and mode state resolution).
 */
export function formatThemeStateConfigCss () {
	return `/* ==========================================================================
   MWI Theme State Configuration
   Generator v1.0
   ========================================================================== */

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
`;
}

/**
 * Format CSS Tokens for a single chromatic family.
 */
export function formatChromaticCss (generated) {
	const { family, base, light, dark, strategy, tuning } = generated;
	const isAnchored = strategy === 'anchored';
	const familyConfig = COLOR_FAMILIES[family] || { name: family, roleKey: family };
	const baseFormatted = formatOklch(base.l, base.c, base.h, { percent: true });
	const inGamut = oklchToSrgb(base.l, base.c, base.h).inGamut;
	const gamutStatus = inGamut ? 'sRGB OK' : 'Gamut Clipped';

	let headerTitle = `MWI Theme Tokens: ${familyConfig.name}`;
	let sourceLine = `Source: ${baseFormatted} | Gamut: ${gamutStatus} | Generator v1.0`;
	let reproduceJson;

	if (isAnchored) {
		headerTitle = `MWI Theme Tokens: ${familyConfig.name} (Anchored Brand Mode)`;
		sourceLine = `Source: ${baseFormatted} | Strategy: anchored | Gamut: ${gamutStatus}`;
		reproduceJson = JSON.stringify({
			family,
			strategy: 'anchored',
			anchorHex: light[`--color-${family}`]?.cssValue || oklchToHex(base.l, base.c, base.h),
			tuning: tuning || DEFAULT_BRAND_TUNING,
		});
	} else {
		reproduceJson = JSON.stringify({
			family,
			base: formatOklch(base.l, base.c, base.h, { percent: false, precision: 4 }),
		});
	}

	const lightTokenLines = Object.values(light)
		.map((t) => `  ${t.name}: ${t.cssValue};`)
		.join('\n');

	const darkTokenLines = Object.values(dark)
		.map((t) => `  ${t.name}: ${t.cssValue};`)
		.join('\n');

	return `/* ==========================================================================
   ${headerTitle}
   ${sourceLine}
   Reproduce: ${reproduceJson}
   ========================================================================== */

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

	const isAnchored = generated.strategy === 'anchored';

	const out = {
		version: '1.0',
		family: generated.family,
		strategy: generated.strategy || 'tonal',
	};

	if (isAnchored) {
		out.anchor = {
			space: 'oklch',
			l: +generated.base.l.toFixed(4),
			c: +generated.base.c.toFixed(4),
			h: +generated.base.h.toFixed(2),
			hex: generated.light[`--color-${generated.family}`]?.cssValue || oklchToHex(generated.base.l, generated.base.c, generated.base.h),
		};
		out.darkAnchor = generated.darkAnchorOklch ? {
			space: 'oklch',
			l: +generated.darkAnchorOklch.l.toFixed(4),
			c: +generated.darkAnchorOklch.c.toFixed(4),
			h: +generated.darkAnchorOklch.h.toFixed(2),
			hex: oklchToHex(generated.darkAnchorOklch.l, generated.darkAnchorOklch.c, generated.darkAnchorOklch.h),
		} : null;
		out.tuning = generated.tuning ? { ...generated.tuning } : { ...DEFAULT_BRAND_TUNING };
	} else {
		out.base = {
			space: 'oklch',
			l: +generated.base.l.toFixed(4),
			c: +generated.base.c.toFixed(4),
			h: +generated.base.h.toFixed(2),
		};
	}

	out.compliance = complianceObj;

	return JSON.stringify(out, null, 2);
}

/**
 * Parse and validate an imported JSON configuration string.
 * @param {string} jsonString
 * @returns {{ valid: boolean, config?: Object, error?: string }}
 */
export function parseAndValidateJsonConfig (jsonString) {
	if (!jsonString || typeof jsonString !== 'string') {
		return { valid: false, error: 'Input must be a non-empty string.' };
	}

	let data;
	try {
		data = JSON.parse(jsonString);
	} catch (err) {
		return { valid: false, error: `Invalid JSON format: ${err.message}` };
	}

	if (!data || typeof data !== 'object') {
		return { valid: false, error: 'JSON root must be an object.' };
	}

	// Validate Family
	const validFamilies = Object.keys(COLOR_FAMILIES);
	if (!data.family || typeof data.family !== 'string' || !validFamilies.includes(data.family)) {
		return {
			valid: false,
			error: `Invalid or missing "family". Expected one of: ${validFamilies.join(', ')}`,
		};
	}

	const strategy = data.strategy === 'anchored' ? 'anchored' : 'tonal';

	// Extract base / anchor color
	let oklch = null;
	const colorSource = data.anchor || data.base;

	if (typeof colorSource === 'string') {
		oklch = parseOklch(colorSource) || hexToOklch(colorSource);
	} else if (colorSource && typeof colorSource === 'object') {
		if (typeof colorSource.l === 'number' && typeof colorSource.c === 'number' && typeof colorSource.h === 'number') {
			oklch = {
				l: Math.max(0, Math.min(1, colorSource.l)),
				c: Math.max(0, Math.min(0.5, colorSource.c)),
				h: (colorSource.h % 360 + 360) % 360,
			};
		} else if (colorSource.hex && typeof colorSource.hex === 'string') {
			oklch = hexToOklch(colorSource.hex);
		}
	} else if (data.anchorHex && typeof data.anchorHex === 'string') {
		oklch = hexToOklch(data.anchorHex);
	}

	if (!oklch) {
		return {
			valid: false,
			error: 'Unable to extract valid OKLCH color from "anchor" or "base" properties.',
		};
	}

	if (strategy === 'anchored') {
		// Validate and sanitize tuning parameters
		const tuning = { ...DEFAULT_BRAND_TUNING };
		if (data.tuning && typeof data.tuning === 'object') {
			if (typeof data.tuning.containerChromaFactor === 'number') {
				tuning.containerChromaFactor = Math.max(0.05, Math.min(1.0, data.tuning.containerChromaFactor));
			}
			if (typeof data.tuning.containerLightness === 'number') {
				tuning.containerLightness = Math.max(0.5, Math.min(0.99, data.tuning.containerLightness));
			}
			if (typeof data.tuning.minContrastRatio === 'number') {
				tuning.minContrastRatio = Math.max(1.0, Math.min(21.0, data.tuning.minContrastRatio));
			}
			if (typeof data.tuning.partnerChroma === 'number') {
				tuning.partnerChroma = Math.max(0.0, Math.min(0.1, data.tuning.partnerChroma));
			}
			if (typeof data.tuning.darkTargetLightness === 'number') {
				tuning.darkTargetLightness = Math.max(0.5, Math.min(0.99, data.tuning.darkTargetLightness));
			}
			if (['auto', 'darken', 'lighten'].includes(data.tuning.autoTuneDirection)) {
				tuning.autoTuneDirection = data.tuning.autoTuneDirection;
			}
		}

		// Validate optional darkAnchor
		let darkAnchorOklch = null;
		if (data.darkAnchor && typeof data.darkAnchor === 'object') {
			if (typeof data.darkAnchor.l === 'number' && typeof data.darkAnchor.c === 'number' && typeof data.darkAnchor.h === 'number') {
				darkAnchorOklch = {
					l: Math.max(0, Math.min(1, data.darkAnchor.l)),
					c: Math.max(0, Math.min(0.5, data.darkAnchor.c)),
					h: (data.darkAnchor.h % 360 + 360) % 360,
				};
			} else if (data.darkAnchor.hex && typeof data.darkAnchor.hex === 'string') {
				darkAnchorOklch = hexToOklch(data.darkAnchor.hex);
			}
		}

		return {
			valid: true,
			config: {
				version: data.version || '1.0',
				family: data.family,
				strategy: 'anchored',
				anchorOklch: oklch,
				baseOklch: oklch,
				tuning,
				darkAnchorOklch,
			},
		};
	}

	return {
		valid: true,
		config: {
			version: data.version || '1.0',
			family: data.family,
			strategy: 'tonal',
			baseOklch: oklch,
		},
	};
}
