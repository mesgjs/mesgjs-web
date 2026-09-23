/**
 * @file role-recipes.esm.js
 * Definitions and generator recipes for MWI Semantic and Generative Color Tokens.
 */

import {
	oklchToSrgb,
	rgbToHex,
	getRelativeLuminanceFromOklch,
	calculateContrastRatio,
	formatOklch,
} from './color-engine.esm.js';

/**
 * Standard Presets / Color Families
 */
export const COLOR_FAMILIES = {
	primary: {
		name: 'Primary',
		roleKey: 'pri',
		defaultOklch: { l: 0.55, c: 0.18, h: 260 },
		defaultHex: '#3454D1',
		description: 'Core brand identity and primary interaction points',
	},
	secondary: {
		name: 'Secondary',
		roleKey: 'sec',
		defaultOklch: { l: 0.60, c: 0.12, h: 210 },
		defaultHex: '#007A99',
		description: 'Supporting accent and secondary elements',
	},
	tertiary: {
		name: 'Tertiary',
		roleKey: 'ter',
		defaultOklch: { l: 0.65, c: 0.14, h: 150 },
		defaultHex: '#00825A',
		description: 'Contrasting accent and visual balance',
	},
	neutral: {
		name: 'Neutral',
		roleKey: 'neu',
		defaultOklch: { l: 0.55, c: 0.02, h: 260 },
		defaultHex: '#6E717E',
		description: 'Surfaces, background elevations, borders, and typography',
	},
	success: {
		name: 'Success',
		roleKey: 'suc',
		defaultOklch: { l: 0.62, c: 0.17, h: 142 },
		defaultHex: '#1B873F',
		description: 'Confirmations, positive states, and completions',
	},
	info: {
		name: 'Info',
		roleKey: 'inf',
		defaultOklch: { l: 0.58, c: 0.16, h: 235 },
		defaultHex: '#0077B6',
		description: 'Informational callouts and alerts',
	},
	warning: {
		name: 'Warning',
		roleKey: 'war',
		defaultOklch: { l: 0.72, c: 0.16, h: 75 },
		defaultHex: '#C06A00',
		description: 'Cautions, warnings, and attention items',
	},
	error: {
		name: 'Error',
		roleKey: 'err',
		defaultOklch: { l: 0.55, c: 0.22, h: 25 },
		defaultHex: '#BA1A1A',
		description: 'Critical alerts, error states, and destructive actions',
	},
};

/**
 * Chromatic Role Recipes
 */
export const CHROMATIC_RECIPES = {
	light: [
		{ tokenSuffix: '', l: 0.40, cFactor: 1.0, partnerSuffix: '-on', targetRatio: 4.5, name: 'Main Container/Fill' },
		{ tokenSuffix: '-on', l: 0.99, cFactor: 0.0, partnerSuffix: '', targetRatio: 4.5, name: 'Text on Main Fill' },
		{ tokenSuffix: '-container', l: 0.90, cFactor: 0.35, partnerSuffix: '-on-container', targetRatio: 4.5, name: 'Container Background' },
		{ tokenSuffix: '-on-container', l: 0.12, cFactor: 0.65, partnerSuffix: '-container', targetRatio: 4.5, name: 'Text on Container' },
		{ tokenSuffix: '-fixed', l: 0.90, cFactor: 0.40, partnerSuffix: '-on-fixed', targetRatio: 4.5, name: 'Fixed Surface' },
		{ tokenSuffix: '-fixed-dim', l: 0.82, cFactor: 0.45, partnerSuffix: '-on-fixed', targetRatio: 4.5, name: 'Fixed Surface Dim' },
		{ tokenSuffix: '-on-fixed', l: 0.10, cFactor: 0.60, partnerSuffix: '-fixed', targetRatio: 4.5, name: 'Text on Fixed' },
		{ tokenSuffix: '-on-fixed-variant', l: 0.28, cFactor: 0.50, partnerSuffix: '-fixed', targetRatio: 4.5, name: 'Variant Text on Fixed' },
	],
	dark: [
		{ tokenSuffix: '', l: 0.80, cFactor: 0.65, partnerSuffix: '-on', targetRatio: 4.5, name: 'Main Container/Fill' },
		{ tokenSuffix: '-on', l: 0.15, cFactor: 0.50, partnerSuffix: '', targetRatio: 4.5, name: 'Text on Main Fill' },
		{ tokenSuffix: '-container', l: 0.30, cFactor: 0.70, partnerSuffix: '-on-container', targetRatio: 4.5, name: 'Container Background' },
		{ tokenSuffix: '-on-container', l: 0.92, cFactor: 0.30, partnerSuffix: '-container', targetRatio: 4.5, name: 'Text on Container' },
		{ tokenSuffix: '-fixed', l: 0.90, cFactor: 0.40, partnerSuffix: '-on-fixed', targetRatio: 4.5, name: 'Fixed Surface' },
		{ tokenSuffix: '-fixed-dim', l: 0.82, cFactor: 0.45, partnerSuffix: '-on-fixed', targetRatio: 4.5, name: 'Fixed Surface Dim' },
		{ tokenSuffix: '-on-fixed', l: 0.10, cFactor: 0.60, partnerSuffix: '-fixed', targetRatio: 4.5, name: 'Text on Fixed' },
		{ tokenSuffix: '-on-fixed-variant', l: 0.28, cFactor: 0.50, partnerSuffix: '-fixed', targetRatio: 4.5, name: 'Variant Text on Fixed' },
	],
};

/**
 * Generative Neutral / Surface Definitions
 */
export const NEUTRAL_DEFINITIONS = {
	light: {
		generative: {
			'--surface-base-l': '98%',
			'--surface-base-c': '0.005',
			'--surface-delta-l-sign': '-1',
			'--surface-delta-l-scale': '4%',
			'--surface-delta-c-sign': '1',
			'--surface-delta-c-scale': '0.003',
		},
		semantic: [
			{ tokenName: '--color-on-surface', l: 0.12, cFactor: 0.10, name: 'High Contrast Body Text' },
			{ tokenName: '--color-on-surface-variant', l: 0.35, cFactor: 0.20, name: 'Secondary / Caption Text' },
			{ tokenName: '--color-outline', l: 0.50, cFactor: 0.20, name: 'Component Borders & Dividers' },
			{ tokenName: '--color-outline-variant', l: 0.80, cFactor: 0.10, name: 'Subtle Dividers' },
			{ tokenName: '--color-inverse-surface', l: 0.18, cFactor: 0.10, name: 'Inverse Surface (Snackbars)' },
			{ tokenName: '--color-inverse-on-surface', l: 0.95, cFactor: 0.05, name: 'Inverse Text' },
		],
	},
	dark: {
		generative: {
			'--surface-base-l': '8%',
			'--surface-base-c': '0.020',
			'--surface-delta-l-sign': '1',
			'--surface-delta-l-scale': '5%',
			'--surface-delta-c-sign': '-1',
			'--surface-delta-c-scale': '0.002',
		},
		semantic: [
			{ tokenName: '--color-on-surface', l: 0.92, cFactor: 0.10, name: 'High Contrast Body Text' },
			{ tokenName: '--color-on-surface-variant', l: 0.75, cFactor: 0.20, name: 'Secondary / Caption Text' },
			{ tokenName: '--color-outline', l: 0.55, cFactor: 0.20, name: 'Component Borders & Dividers' },
			{ tokenName: '--color-outline-variant', l: 0.30, cFactor: 0.10, name: 'Subtle Dividers' },
			{ tokenName: '--color-inverse-surface', l: 0.90, cFactor: 0.10, name: 'Inverse Surface (Snackbars)' },
			{ tokenName: '--color-inverse-on-surface', l: 0.12, cFactor: 0.05, name: 'Inverse Text' },
		],
	},
};

/**
 * Generate tokens for a chromatic family given a base OKLCH color.
 */
export function generateChromaticTokens (familyId, baseOklch) {
	const result = {
		family: familyId,
		base: { ...baseOklch },
		light: {},
		dark: {},
		compliance: {},
	};

	for (const mode of ['light', 'dark']) {
		const recipes = CHROMATIC_RECIPES[mode];
		const tokens = {};

		for (const recipe of recipes) {
			const tokenName = recipe.tokenOverride || (
				recipe.tokenSuffix.startsWith('-on')
					? `--color-on-${familyId}${recipe.tokenSuffix.slice(3)}`
					: `--color-${familyId}${recipe.tokenSuffix}`
			);

			const l = recipe.l;
			const c = baseOklch.c * recipe.cFactor;
			const h = baseOklch.h;

			const srgb = oklchToSrgb(l, c, h);
			const hexValue = rgbToHex(srgb.r, srgb.g, srgb.b).toUpperCase();

			tokens[tokenName] = {
				name: tokenName,
				label: recipe.name,
				oklch: { l, c, h },
				oklchValue: formatOklch(l, c, h, { percent: true }),
				hex: hexValue,
				cssValue: hexValue,
				inGamut: srgb.inGamut,
				srgbHex: hexValue,
				partnerToken: recipe.partnerSuffix !== undefined
					? (recipe.partnerSuffix.startsWith('-on')
							? `--color-on-${familyId}${recipe.partnerSuffix.slice(3)}`
							: `--color-${familyId}${recipe.partnerSuffix}`)
					: null,
			};
		}

		result[mode] = tokens;
	}

	// Calculate contrast pairs
	for (const mode of ['light', 'dark']) {
		const tokens = result[mode];
		const pairs = [
			{
				id: `${mode}Main`,
				name: `${mode === 'light' ? 'Light' : 'Dark'} Main vs On-Main`,
				t1: `--color-${familyId}`,
				t2: `--color-on-${familyId}`,
			},
			{
				id: `${mode}Container`,
				name: `${mode === 'light' ? 'Light' : 'Dark'} Container vs On-Container`,
				t1: `--color-${familyId}-container`,
				t2: `--color-on-${familyId}-container`,
			},
			{
				id: `${mode}Fixed`,
				name: `${mode === 'light' ? 'Light' : 'Dark'} Fixed vs On-Fixed`,
				t1: `--color-${familyId}-fixed`,
				t2: `--color-on-${familyId}-fixed`,
			},
			{
				id: `${mode}FixedVariant`,
				name: `${mode === 'light' ? 'Light' : 'Dark'} Fixed vs On-Fixed-Variant`,
				t1: `--color-${familyId}-fixed`,
				t2: `--color-on-${familyId}-fixed-variant`,
			},
		];

		for (const pair of pairs) {
			const color1 = tokens[pair.t1]?.oklch;
			const color2 = tokens[pair.t2]?.oklch;

			if (color1 && color2) {
				const lum1 = getRelativeLuminanceFromOklch(color1.l, color1.c, color1.h);
				const lum2 = getRelativeLuminanceFromOklch(color2.l, color2.c, color2.h);
				const ratio = calculateContrastRatio(lum1, lum2);

				result.compliance[pair.id] = {
					name: pair.name,
					ratio,
					passesAA: ratio >= 4.5,
					passesAAA: ratio >= 7.0,
					passesAALarge: ratio >= 3.0,
					token1: pair.t1,
					token2: pair.t2,
				};
			}
		}
	}

	return result;
}

/**
 * Generate neutral tokens & surface model given a base OKLCH color.
 */
export function generateNeutralTokens (baseOklch) {
	const result = {
		family: 'neutral',
		base: { ...baseOklch },
		light: { generative: {}, semantic: {} },
		dark: { generative: {}, semantic: {} },
		compliance: {},
	};

	for (const mode of ['light', 'dark']) {
		const def = NEUTRAL_DEFINITIONS[mode];

		result[mode].generative = {
			...def.generative,
			'--surface-base-h': `${+baseOklch.h.toFixed(1)}`,
		};

		for (const sem of def.semantic) {
			const l = sem.l;
			const c = baseOklch.c * sem.cFactor;
			const h = baseOklch.h;
			const srgb = oklchToSrgb(l, c, h);
			const hexValue = rgbToHex(srgb.r, srgb.g, srgb.b).toUpperCase();

			result[mode].semantic[sem.tokenName] = {
				name: sem.tokenName,
				label: sem.name,
				oklch: { l, c, h },
				oklchValue: formatOklch(l, c, h, { percent: true }),
				hex: hexValue,
				cssValue: hexValue,
				inGamut: srgb.inGamut,
				srgbHex: hexValue,
			};
		}
	}

	// Calculate contrast of surface vs on-surface
	const lightSurfL = 0.98;
	const lightOnSurf = result.light.semantic['--color-on-surface'].oklch;
	const lightLumSurf = getRelativeLuminanceFromOklch(lightSurfL, 0.005, baseOklch.h);
	const lightLumOnSurf = getRelativeLuminanceFromOklch(lightOnSurf.l, lightOnSurf.c, lightOnSurf.h);

	result.compliance.lightSurface = {
		name: 'Light Surface vs On-Surface',
		ratio: calculateContrastRatio(lightLumSurf, lightLumOnSurf),
		passesAA: calculateContrastRatio(lightLumSurf, lightLumOnSurf) >= 4.5,
		passesAAA: calculateContrastRatio(lightLumSurf, lightLumOnSurf) >= 7.0,
	};

	const darkSurfL = 0.08;
	const darkOnSurf = result.dark.semantic['--color-on-surface'].oklch;
	const darkLumSurf = getRelativeLuminanceFromOklch(darkSurfL, 0.02, baseOklch.h);
	const darkLumOnSurf = getRelativeLuminanceFromOklch(darkOnSurf.l, darkOnSurf.c, darkOnSurf.h);

	result.compliance.darkSurface = {
		name: 'Dark Surface vs On-Surface',
		ratio: calculateContrastRatio(darkLumSurf, darkLumOnSurf),
		passesAA: calculateContrastRatio(darkLumSurf, darkLumOnSurf) >= 4.5,
		passesAAA: calculateContrastRatio(darkLumSurf, darkLumOnSurf) >= 7.0,
	};

	return result;
}
