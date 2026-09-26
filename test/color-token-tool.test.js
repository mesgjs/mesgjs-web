/**
 * @file color-token-tool.test.js
 * Unit and compliance verification tests for MWI Color Token Generator Tool.
 */

import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import {
	oklchToOklab,
	oklabToOklch,
	oklchToSrgb,
	srgbToOklch,
	hexToRgb,
	rgbToHex,
	hexToOklch,
	oklchToHex,
	parseOklch,
	formatOklch,
	getRelativeLuminanceFromOklch,
	calculateContrastRatio,
	getOklchContrast,
	solvePartnerColor,
	calculateComplianceAdjustment,
} from '../util/color-token-generator/js/color-engine.esm.js';

import {
	COLOR_FAMILIES,
	DEFAULT_BRAND_TUNING,
	generateTokens,
	generateChromaticTokens,
	generateNeutralTokens,
	generateAnchoredChromaticTokens,
} from '../util/color-token-generator/js/role-recipes.esm.js';

import {
	formatThemeStateConfigCss,
	formatChromaticCss,
	formatNeutralCss,
	formatJsonConfig,
	parseAndValidateJsonConfig,
} from '../util/color-token-generator/js/token-exporter.esm.js';

Deno.test("Color Engine - Conversion & Gamut Transforms", async (t) => {
	await t.step("OKLCH <-> OKLab round-trip", () => {
		const l = 0.65, c = 0.15, h = 180;
		const lab = oklchToOklab(l, c, h);
		const lch = oklabToOklch(lab.l, lab.a, lab.b);

		assert(Math.abs(lch.l - l) < 1e-5, "Lightness preserved");
		assert(Math.abs(lch.c - c) < 1e-5, "Chroma preserved");
		assert(Math.abs(lch.h - h) < 1e-4, "Hue preserved");
	});

	await t.step("Hex <-> RGB conversions", () => {
		const hex = "#3454d1";
		const rgb = hexToRgb(hex);
		assert(rgb !== null, "Hex parsing succeeds");
		const backHex = rgbToHex(rgb.r, rgb.g, rgb.b);
		assertEquals(backHex.toLowerCase(), hex.toLowerCase(), "Hex roundtrip succeeds");
	});

	await t.step("OKLCH string parsing and formatting", () => {
		const parsed = parseOklch("oklch(55% 0.18 260deg)");
		assert(parsed !== null, "Parsing percentage and deg works");
		assert(Math.abs(parsed.l - 0.55) < 1e-4, "Parsed lightness matches");
		assertEquals(parsed.c, 0.18, "Parsed chroma matches");
		assertEquals(parsed.h, 260, "Parsed hue matches");

		const formatted = formatOklch(parsed.l, parsed.c, parsed.h, { percent: true });
		assertEquals(formatted, "oklch(55% 0.18 260)", "Formatted string matches");
	});
});

Deno.test("Color Engine - WCAG Contrast Math", async (t) => {
	await t.step("Black and White luminance and contrast", () => {
		const blackLum = getRelativeLuminanceFromOklch(0, 0, 0);
		const whiteLum = getRelativeLuminanceFromOklch(1, 0, 0);

		assert(Math.abs(blackLum - 0.0) < 0.01, "Black luminance is near 0");
		assert(Math.abs(whiteLum - 1.0) < 0.01, "White luminance is near 1");

		const ratio = calculateContrastRatio(blackLum, whiteLum);
		assert(ratio >= 20.0, "Black vs white contrast is ~21:1");
	});

	await t.step("Contrast evaluation helper", () => {
		const c1 = { l: 0.40, c: 0.18, h: 260 };
		const c2 = { l: 0.99, c: 0.0, h: 260 };
		const res = getOklchContrast(c1, c2);

		assert(res.ratio >= 4.5, `Should pass WCAG AA (ratio: ${res.ratio})`);
		assertEquals(res.passesAA, true);
	});
});

Deno.test("Role Recipes - Preset Compliance", async (t) => {
	for (const [famKey, famDef] of Object.entries(COLOR_FAMILIES)) {
		await t.step(`Preset: ${famKey} passes role contrast requirements`, () => {
			if (famKey === 'neutral') {
				const generated = generateNeutralTokens(famDef.defaultOklch);
				assert(generated.compliance.lightSurface.passesAA, "Light surface passes AA");
				assert(generated.compliance.darkSurface.passesAA, "Dark surface passes AA");
			} else {
				const generated = generateChromaticTokens(famKey, famDef.defaultOklch);
				assert(generated.compliance.lightMain.passesAA, `${famKey} Light Main passes AA`);
				assert(generated.compliance.lightContainer.passesAA, `${famKey} Light Container passes AA`);
				assert(generated.compliance.darkMain.passesAA, `${famKey} Dark Main passes AA`);
				assert(generated.compliance.darkContainer.passesAA, `${famKey} Dark Container passes AA`);
			}
		});
	}
});

Deno.test("Role Recipes - Token Structure & Serialization", async (t) => {
	await t.step("Chromatic family produces sRGB hex tokens and excludes generic outline/surface-variant", () => {
		const generated = generateChromaticTokens('primary', COLOR_FAMILIES.primary.defaultOklch);

		// Must not contain chromatic overrides for generic tokens
		assertEquals(generated.light['--color-outline'], undefined);
		assertEquals(generated.light['--color-on-surface-variant'], undefined);
		assertEquals(generated.dark['--color-outline'], undefined);
		assertEquals(generated.dark['--color-on-surface-variant'], undefined);

		// Must contain exactly the 8 chromatic paired tokens
		const expectedTokens = [
			'--color-primary',
			'--color-on-primary',
			'--color-primary-container',
			'--color-on-primary-container',
			'--color-primary-fixed',
			'--color-primary-fixed-dim',
			'--color-on-primary-fixed',
			'--color-on-primary-fixed-variant',
		];

		for (const tokenName of expectedTokens) {
			const lightTok = generated.light[tokenName];
			assert(lightTok !== undefined, `Light token ${tokenName} exists`);
			assert(/^#[0-9A-F]{6}$/i.test(lightTok.cssValue), `${tokenName} light cssValue is sRGB hex: ${lightTok.cssValue}`);
			assert(lightTok.oklch !== undefined, `${tokenName} retains internal OKLCH`);

			const darkTok = generated.dark[tokenName];
			assert(darkTok !== undefined, `Dark token ${tokenName} exists`);
			assert(/^#[0-9A-F]{6}$/i.test(darkTok.cssValue), `${tokenName} dark cssValue is sRGB hex: ${darkTok.cssValue}`);
			assert(darkTok.oklch !== undefined, `${tokenName} retains internal OKLCH`);
		}
	});

	await t.step("Neutral family solely owns on-surface, outline, and inverse roles", () => {
		const generated = generateNeutralTokens(COLOR_FAMILIES.neutral.defaultOklch);

		const expectedSemantic = [
			'--color-on-surface',
			'--color-on-surface-variant',
			'--color-outline',
			'--color-outline-variant',
			'--color-inverse-surface',
			'--color-inverse-on-surface',
		];

		for (const semName of expectedSemantic) {
			const lightSem = generated.light.semantic[semName];
			assert(lightSem !== undefined, `Light semantic ${semName} exists`);
			assert(/^#[0-9A-F]{6}$/i.test(lightSem.cssValue), `${semName} light cssValue is sRGB hex: ${lightSem.cssValue}`);

			const darkSem = generated.dark.semantic[semName];
			assert(darkSem !== undefined, `Dark semantic ${semName} exists`);
			assert(/^#[0-9A-F]{6}$/i.test(darkSem.cssValue), `${semName} dark cssValue is sRGB hex: ${darkSem.cssValue}`);
		}

		// Generative parameters retained as OKLCH scalars/strings
		assertEquals(generated.light.generative['--surface-base-l'], '98%');
		assertEquals(generated.light.generative['--surface-base-c'], '0.005');
		assertEquals(generated.dark.generative['--surface-base-l'], '8%');
		assertEquals(generated.dark.generative['--surface-base-c'], '0.020');
	});
});

Deno.test("Token Exporter - CSS and JSON Formatter", async (t) => {
	await t.step("Theme State Configuration CSS exports standalone root setup and mode resolvers", () => {
		const css = formatThemeStateConfigCss();

		assert(css.includes("MWI Theme State Configuration"), "Includes header");
		assert(css.includes("color-scheme: light dark;"), "Includes color-scheme declaration");
		assert(css.includes("--theme-color-mode: light;"), "Includes default color mode");
		assert(css.includes("--theme-contrast-mode: standard;"), "Includes default contrast mode");
		assert(css.includes("@media (prefers-color-scheme: dark)"), "Includes prefers-color-scheme media query");
		assert(css.includes("@media (prefers-contrast: more)"), "Includes prefers-contrast media query");
		assert(css.includes("@media (forced-colors: active)"), "Includes forced-colors media query");
		assert(css.includes("html[data-theme='light']"), "Includes data-theme light override");
		assert(css.includes("html[data-theme='dark']"), "Includes data-theme dark override");
		assert(css.includes("html[data-contrast='high']"), "Includes data-contrast high override");
	});

	await t.step("Chromatic CSS exports modular token blocks without repeating Theme State Configuration", () => {
		const generated = generateChromaticTokens('primary', COLOR_FAMILIES.primary.defaultOklch);
		const css = formatChromaticCss(generated);

		// Excludes redundant state config
		assert(!css.includes("html {"), "Does not duplicate html state resolution block");
		assert(!css.includes("@media (prefers-color-scheme"), "Does not duplicate media queries");
		assert(!css.includes("html[data-theme="), "Does not duplicate attribute overrides");

		// Includes modular container queries
		assert(css.includes("@container theme-cfg style(--theme-color-mode: light)"), "Includes light container query");
		assert(css.includes("@container theme-cfg style(--theme-color-mode: dark)"), "Includes dark container query");

		// Chromatic CSS does not have --m-primary-base in html block
		assert(!css.includes("--m-primary-base:"), "Excludes runtime --m-primary-base");

		// Chromatic CSS tokens are sRGB hex
		assert(css.includes("--color-primary: #"), "Chromatic token is serialized as hex");
		assert(css.includes("--color-on-primary: #"), "On-chromatic token is serialized as hex");

		// Chromatic CSS does not touch generic outline or on-surface-variant
		assert(!css.includes("--color-outline:"), "Chromatic CSS does not override --color-outline");
		assert(!css.includes("--color-on-surface-variant:"), "Chromatic CSS does not override --color-on-surface-variant");

		// Chromatic forced-colors only binds primary role
		assert(css.includes("--color-primary: Highlight;"), "Forced colors binds chromatic role");
		assert(css.includes("--color-on-primary: HighlightText;"), "Forced colors binds on-chromatic role");
		assert(!css.includes("--color-on-surface: CanvasText;"), "Chromatic forced colors does not touch surface tokens");
	});

	await t.step("Neutral CSS includes generative OKLCH parameters, hex semantics, and sole ownership of overrides without repeating Theme State Configuration", () => {
		const generated = generateNeutralTokens(COLOR_FAMILIES.neutral.defaultOklch);
		const css = formatNeutralCss(generated);

		// Excludes redundant state config
		assert(!css.includes("html {"), "Does not duplicate html state resolution block");
		assert(!css.includes("@media (prefers-color-scheme"), "Does not duplicate media queries");

		// Generative OKLCH scalars
		assert(css.includes("--surface-base-l: 98%;"), "Includes light surface base L");
		assert(css.includes("--surface-base-c: 0.005;"), "Includes light surface base C");
		assert(css.includes("--surface-delta-l-sign: -1;"), "Includes light surface delta sign");
		assert(css.includes("--surface-delta-l-scale: 4%;"), "Includes light surface delta scale");
		assert(css.includes("--surface-base-l: 8%;"), "Includes dark surface base L");
		assert(css.includes("--surface-base-c: 0.020;"), "Includes dark surface base C");
		assert(css.includes("--surface-delta-l-sign: 1;"), "Includes dark surface delta sign");
		assert(css.includes("--surface-delta-l-scale: 5%;"), "Includes dark surface delta scale");

		// Semantic tokens are hex
		assert(css.includes("--color-on-surface: #"), "On-surface serialized as hex");
		assert(css.includes("--color-outline: #"), "Outline serialized as hex");
		assert(css.includes("--color-outline-variant: #"), "Outline-variant serialized as hex");

		// No runtime --m-neutral-base
		assert(!css.includes("--m-neutral-base:"), "Excludes runtime --m-neutral-base");

		// High-contrast layer
		assert(css.includes("@container theme-cfg style(--theme-contrast-mode: high)"), "Includes high-contrast layer");
		assert(css.includes("--color-outline: var(--color-on-surface);"), "High-contrast reinforces outline");

		// Forced colors layer
		assert(css.includes("@container theme-cfg style(--theme-contrast-mode: forced)"), "Includes forced colors layer");
		assert(css.includes("--color-on-surface: CanvasText;"), "Forced colors maps on-surface");
		assert(css.includes("--color-outline: ButtonBorder;"), "Forced colors maps outline");
		assert(css.includes("--color-inverse-surface: CanvasText;"), "Forced colors maps inverse surface");
	});

	await t.step("JSON Config serialization preserves base OKLCH and compliance", () => {
		const generated = generateChromaticTokens('primary', COLOR_FAMILIES.primary.defaultOklch);
		const jsonStr = formatJsonConfig(generated);
		const parsed = JSON.parse(jsonStr);

		assertEquals(parsed.version, "1.0");
		assertEquals(parsed.family, "primary");
		assertEquals(parsed.base.space, "oklch");
		assert(parsed.compliance.lightMain !== undefined);
	});
});

Deno.test("Anchored Color Mode - Mathematical Solver & Auto-Tune", async (t) => {
	await t.step("Solve partner color for dark anchor (Navy #0A192F)", () => {
		const anchor = hexToOklch('#0A192F');
		const solved = solvePartnerColor(anchor, { minRatio: 4.5 });

		assertEquals(solved.polarity, 'light');
		assert(solved.ratio >= 12.0, `Navy partner contrast should exceed 12:1 (got ${solved.ratio})`);
		assertEquals(solved.passesAA, true);
		assertEquals(solved.passesAAA, true);
		assert(solved.partnerOklch.l >= 0.95, "Partner lightness should be near white");
	});

	await t.step("Solve partner color for light anchor (Pastel Yellow #FEF08A)", () => {
		const anchor = hexToOklch('#FEF08A');
		const solved = solvePartnerColor(anchor, { minRatio: 4.5 });

		assertEquals(solved.polarity, 'dark');
		assert(solved.ratio >= 10.0, `Pastel Yellow partner contrast should exceed 10:1 (got ${solved.ratio})`);
		assertEquals(solved.passesAA, true);
		assertEquals(solved.passesAAA, true);
		assert(solved.partnerOklch.l <= 0.15, "Partner lightness should be near black");
	});

	await t.step("Mid-tone compliance adjustment calculation (#00A3C4)", () => {
		const anchor = hexToOklch('#00A3C4');
		const adj = calculateComplianceAdjustment(anchor, 4.5, 'auto');

		assert(adj.adjustedOklch !== undefined);
		assert(typeof adj.deltaL === 'number');
		assert(adj.ratio >= 4.49, `Adjusted color ratio must meet 4.5:1 (got ${adj.ratio})`);
	});

	await t.step("Determinism and mathematical reproducibility", () => {
		const anchor = hexToOklch('#0052CC');
		const tuning = { ...DEFAULT_BRAND_TUNING, containerChromaFactor: 0.45 };

		const run1 = generateAnchoredChromaticTokens('primary', anchor, { tuning });
		const run2 = generateAnchoredChromaticTokens('primary', anchor, { tuning });

		assertEquals(JSON.stringify(run1), JSON.stringify(run2), "Identical runs produce byte-for-byte identical output");
	});
});

Deno.test("Anchored Color Mode - Chromatic Generation & Knob Customization", async (t) => {
	const brandHex = '#0052CC';
	const anchor = hexToOklch(brandHex);

	await t.step("Light mode --color-primary exactly preserves input brand color", () => {
		const generated = generateAnchoredChromaticTokens('primary', anchor);
		assertEquals(generated.strategy, 'anchored');
		assertEquals(generated.light['--color-primary'].cssValue.toLowerCase(), brandHex.toLowerCase());
		assert(generated.compliance.lightMain.passesAA, "Derived on-primary satisfies AA");
	});

	await t.step("Container Chroma Factor knob modulates container vibrancy", () => {
		const genLowChroma = generateAnchoredChromaticTokens('primary', anchor, {
			tuning: { containerChromaFactor: 0.15 },
		});
		const genHighChroma = generateAnchoredChromaticTokens('primary', anchor, {
			tuning: { containerChromaFactor: 0.50 },
		});

		const lowC = genLowChroma.light['--color-primary-container'].oklch.c;
		const highC = genHighChroma.light['--color-primary-container'].oklch.c;

		assert(highC > lowC, "Higher containerChromaFactor yields higher chroma container");
		assert(genLowChroma.compliance.lightContainer.passesAA, "Low chroma container passes AA");
		assert(genHighChroma.compliance.lightContainer.passesAA, "High chroma container passes AA");
	});

	await t.step("Dark Target Lightness knob adjusts dark mode brand luminance", () => {
		const genL70 = generateAnchoredChromaticTokens('primary', anchor, {
			tuning: { darkTargetLightness: 0.70 },
		});
		const genL85 = generateAnchoredChromaticTokens('primary', anchor, {
			tuning: { darkTargetLightness: 0.85 },
		});

		assertEquals(genL70.dark['--color-primary'].oklch.l, 0.70);
		assertEquals(genL85.dark['--color-primary'].oklch.l, 0.85);
		assert(genL70.compliance.darkMain.passesAA, "Dark L=0.70 passes AA");
		assert(genL85.compliance.darkMain.passesAA, "Dark L=0.85 passes AA");
	});

	await t.step("Explicit dark anchor overrides auto-synthesized dark mode role", () => {
		const explicitDarkHex = '#7090FF';
		const darkAnchor = hexToOklch(explicitDarkHex);
		const genExplicit = generateAnchoredChromaticTokens('primary', anchor, {
			darkAnchorOklch: darkAnchor,
		});

		assertEquals(genExplicit.dark['--color-primary'].cssValue.toLowerCase(), explicitDarkHex.toLowerCase());
		assert(genExplicit.compliance.darkMain.passesAA, "Explicit dark anchor passes AA against derived on-primary");
	});

	await t.step("Universal dispatcher generateTokens routes appropriately", () => {
		const tonal = generateTokens('primary', anchor, { strategy: 'tonal' });
		const anchored = generateTokens('primary', anchor, { strategy: 'anchored' });
		const neutral = generateTokens('neutral', anchor, { strategy: 'anchored' });

		assertEquals(tonal.strategy, 'tonal');
		assertEquals(anchored.strategy, 'anchored');
		assertEquals(neutral.family, 'neutral');
	});
});

Deno.test("Anchored Color Mode - Import & Export Round-Trip", async (t) => {
	const brandHex = '#E11D48';
	const anchor = hexToOklch(brandHex);
	const customTuning = {
		containerChromaFactor: 0.40,
		containerLightness: 0.88,
		minContrastRatio: 4.5,
		partnerChroma: 0.01,
		darkTargetLightness: 0.78,
		autoTuneDirection: 'auto',
	};

	await t.step("CSS Export includes Anchored metadata header", () => {
		const generated = generateAnchoredChromaticTokens('primary', anchor, { tuning: customTuning });
		const css = formatChromaticCss(generated);

		assert(css.includes("MWI Theme Tokens: Primary (Anchored Brand Mode)"), "CSS header indicates Anchored mode");
		assert(css.includes('Strategy: anchored'), "CSS header includes anchored strategy flag");
		assert(css.includes(`"strategy":"anchored"`), "CSS reproduction JSON includes anchored strategy");
	});

	await t.step("JSON Config round-trip preserves strategy, anchor, and tuning knobs", () => {
		const generated = generateAnchoredChromaticTokens('secondary', anchor, { tuning: customTuning });
		const jsonStr = formatJsonConfig(generated);

		const result = parseAndValidateJsonConfig(jsonStr);
		assertEquals(result.valid, true, "JSON parsing and validation succeeds");

		const cfg = result.config;
		assertEquals(cfg.family, 'secondary');
		assertEquals(cfg.strategy, 'anchored');
		assert(Math.abs(cfg.anchorOklch.l - anchor.l) < 1e-3, "Anchor L preserved");
		assert(Math.abs(cfg.anchorOklch.c - anchor.c) < 1e-3, "Anchor C preserved");
		assert(Math.abs(cfg.anchorOklch.h - anchor.h) < 1e-2, "Anchor H preserved");
		assertEquals(cfg.tuning.containerChromaFactor, 0.40);
		assertEquals(cfg.tuning.containerLightness, 0.88);
		assertEquals(cfg.tuning.darkTargetLightness, 0.78);
		assertEquals(cfg.tuning.partnerChroma, 0.01);
	});

	await t.step("JSON Validation catches malformed input and invalid values gracefully", () => {
		const invalid1 = parseAndValidateJsonConfig("invalid json");
		assertEquals(invalid1.valid, false);
		assert(invalid1.error.includes("Invalid JSON"));

		const invalid2 = parseAndValidateJsonConfig(JSON.stringify({ family: "unknown-family" }));
		assertEquals(invalid2.valid, false);
		assert(invalid2.error.includes("Invalid or missing \"family\""));

		const invalid3 = parseAndValidateJsonConfig(JSON.stringify({ family: "primary", base: "invalid-color" }));
		assertEquals(invalid3.valid, false);
		assert(invalid3.error.includes("Unable to extract valid OKLCH"));
	});
});
