/**
 * @file color-engine.esm.js
 * High-precision Color Math, Gamut Mapping, and WCAG 2.1 Contrast Engine.
 * Supports OKLCH, OKLab, Linear sRGB, sRGB (gamma), and Hex conversions.
 */

/**
 * Standard D65 white point matrices and constants for OKLab / Linear sRGB.
 */

// OKLCH -> OKLab
export function oklchToOklab (l, c, h) {
	const rad = (h * Math.PI) / 180;

	return {
		l,
		a: c * Math.cos(rad),
		b: c * Math.sin(rad),
	};
}

// OKLab -> OKLCH
export function oklabToOklch (l, a, b) {
	const c = Math.hypot(a, b);
	let h = (Math.atan2(b, a) * 180) / Math.PI;

	if (h < 0) h += 360;
	return { l, c, h: c < 1e-6 ? 0 : h };
}

// OKLab -> Linear sRGB
export function oklabToLinearSrgb (l, a, b) {
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

	const lCube = l_ * l_ * l_;
	const mCube = m_ * m_ * m_;
	const sCube = s_ * s_ * s_;

	return {
		r: +4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube,
		g: -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube,
		b: -0.0041960863 * lCube - 0.7034186147 * mCube + 1.7076147010 * sCube,
	};
}

// Linear sRGB -> OKLab
export function linearSrgbToOklab (r, g, b) {
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);

	return {
		l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
		a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
		b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
	};
}

// Linear channel to sRGB gamma transfer function (0..1)
export function linearToSrgbChannel (c) {
	const abs = Math.abs(c);
	const val = abs <= 0.0031308 ? 12.92 * abs : 1.055 * Math.pow(abs, 1.0 / 2.4) - 0.055;

	return Math.sign(c) * val;
}

// sRGB gamma channel to Linear channel (0..1)
export function srgbChannelToLinear (c) {
	const abs = Math.abs(c);

	return abs <= 0.04045 ? abs / 12.92 : Math.pow((abs + 0.055) / 1.055, 2.4);
}

// OKLCH -> sRGB { r, g, b, inGamut } where r, g, b are in [0, 1] (clipped)
export function oklchToSrgb (l, c, h) {
	const { a, b } = oklchToOklab(l, c, h);
	const lin = oklabToLinearSrgb(l, a, b);

	const rawR = linearToSrgbChannel(lin.r);
	const rawG = linearToSrgbChannel(lin.g);
	const rawB = linearToSrgbChannel(lin.b);

	const eps = 0.0005;
	const inGamut =
		rawR >= -eps && rawR <= 1 + eps &&
		rawG >= -eps && rawG <= 1 + eps &&
		rawB >= -eps && rawB <= 1 + eps;

	return {
		r: Math.min(Math.max(rawR, 0), 1),
		g: Math.min(Math.max(rawG, 0), 1),
		b: Math.min(Math.max(rawB, 0), 1),
		rawR,
		rawG,
		rawB,
		inGamut,
	};
}

// sRGB (0..1) -> OKLCH { l, c, h }
export function srgbToOklch (r, g, b) {
	const linR = srgbChannelToLinear(r);
	const linG = srgbChannelToLinear(g);
	const linB = srgbChannelToLinear(b);

	const lab = linearSrgbToOklab(linR, linG, linB);

	return oklabToOklch(lab.l, lab.a, lab.b);
}

// Hex (#RGB, #RRGGBB) to sRGB [0, 1]
export function hexToRgb (hex) {
	let clean = hex.trim().replace(/^#/, '');

	if (clean.length === 3) {
		clean = clean.split('').map((ch) => ch + ch).join('');
	}
	if (clean.length !== 6) return null;

	const num = parseInt(clean, 16);

	if (isNaN(num)) return null;
	return {
		r: ((num >> 16) & 255) / 255,
		g: ((num >> 8) & 255) / 255,
		b: (num & 255) / 255,
	};
}

// sRGB [0, 1] to Hex (#rrggbb)
export function rgbToHex (r, g, b) {
	const to255 = (v) => Math.min(255, Math.max(0, Math.round(v * 255)));
	const r255 = to255(r);
	const g255 = to255(g);
	const b255 = to255(b);

	return '#' + [r255, g255, b255].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// OKLCH -> Hex
export function oklchToHex (l, c, h) {
	const { r, g, b } = oklchToSrgb(l, c, h);

	return rgbToHex(r, g, b);
}

// Hex -> OKLCH
export function hexToOklch (hex) {
	const rgb = hexToRgb(hex);

	if (!rgb) return null;
	return srgbToOklch(rgb.r, rgb.g, rgb.b);
}

// Parse OKLCH string e.g. "oklch(0.55 0.18 260)" or "oklch(55% 0.18 260)"
export function parseOklch (str) {
	if (typeof str !== 'string') return null;

	const m = str.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+(?:deg)?)\s*(?:\/\s*[\d.]+%?)?\s*\)/i);

	if (!m) return null;

	let l = parseFloat(m[1]);

	if (m[1].endsWith('%')) l /= 100;

	let c = parseFloat(m[2]);

	let h = parseFloat(m[3]);

	if (isNaN(l) || isNaN(c) || isNaN(h)) return null;
	h = (h % 360 + 360) % 360;

	return { l, c, h };
}

// Format OKLCH to CSS string e.g. "oklch(55% 0.18 260)" or "oklch(0.55 0.18 260)"
export function formatOklch (l, c, h, { percent = false, precision = 4 } = {}) {
	const lStr = percent ? `${+(l * 100).toFixed(2)}%` : `${+l.toFixed(precision)}`;
	const cStr = `${+c.toFixed(precision)}`;
	const hStr = `${+h.toFixed(precision)}`;

	return `oklch(${lStr} ${cStr} ${hStr})`;
}

/**
 * WCAG 2.1 Relative Luminance and Contrast Ratio
 */

// Relative luminance Y = 0.2126 * Rlin + 0.7152 * Glin + 0.0722 * Blin
export function getRelativeLuminanceFromSrgb (r, g, b) {
	const linR = srgbChannelToLinear(r);
	const linG = srgbChannelToLinear(g);
	const linB = srgbChannelToLinear(b);

	return 0.2126 * linR + 0.7152 * linG + 0.0722 * linB;
}

export function getRelativeLuminanceFromOklch (l, c, h) {
	const { r, g, b } = oklchToSrgb(l, c, h);

	return getRelativeLuminanceFromSrgb(r, g, b);
}

// Contrast ratio = (Y1 + 0.05) / (Y2 + 0.05)
export function calculateContrastRatio (lum1, lum2) {
	const max = Math.max(lum1, lum2);
	const min = Math.min(lum1, lum2);

	return (max + 0.05) / (min + 0.05);
}

// Convenience to calculate contrast directly between two OKLCH colors
export function getOklchContrast (color1, color2) {
	const lum1 = getRelativeLuminanceFromOklch(color1.l, color1.c, color1.h);
	const lum2 = getRelativeLuminanceFromOklch(color2.l, color2.c, color2.h);
	const ratio = calculateContrastRatio(lum1, lum2);

	return {
		ratio,
		passesAA: ratio >= 4.5,
		passesAAA: ratio >= 7.0,
		passesAALarge: ratio >= 3.0,
	};
}
