/**
 * @file main.esm.js
 * Main UI Orchestrator, DOM Synchronization, and Event Handling.
 */

import {
	oklchToHex,
	hexToOklch,
	oklchToSrgb,
	formatOklch,
} from './color-engine.esm.js';

import {
	COLOR_FAMILIES,
	generateChromaticTokens,
	generateNeutralTokens,
} from './role-recipes.esm.js';

import {
	formatChromaticCss,
	formatNeutralCss,
	formatJsonConfig,
} from './token-exporter.esm.js';

import { HughBridge } from './hugh-bridge.esm.js';

// Application State
const state = {
	family: 'primary',
	baseOklch: { l: 0.55, c: 0.18, h: 260 },
	previewMode: 'light', // 'light' | 'dark' | 'hc' | 'forced'
	exportTab: 'css', // 'css' | 'json'
	uiTheme: 'dark',
};

// DOM References
const els = {
	familySelect: document.getElementById('family-select'),
	nativeColorPicker: document.getElementById('native-color-picker'),
	hexInput: document.getElementById('hex-input'),
	sliderL: document.getElementById('slider-l'),
	inputL: document.getElementById('input-l'),
	sliderC: document.getElementById('slider-c'),
	inputC: document.getElementById('input-c'),
	sliderH: document.getElementById('slider-h'),
	inputH: document.getElementById('input-h'),
	gamutBadge: document.getElementById('gamut-badge'),
	autoNudgeBtn: document.getElementById('auto-nudge-btn'),
	complianceList: document.getElementById('compliance-list'),
	tokenGrid: document.getElementById('token-grid'),
	previewSandbox: document.getElementById('preview-sandbox'),
	previewLightBtn: document.getElementById('preview-light-btn'),
	previewDarkBtn: document.getElementById('preview-dark-btn'),
	previewHcBtn: document.getElementById('preview-hc-btn'),
	previewForcedBtn: document.getElementById('preview-forced-btn'),
	tabCssBtn: document.getElementById('tab-css-btn'),
	tabJsonBtn: document.getElementById('tab-json-btn'),
	codeOutput: document.getElementById('code-output'),
	exportFilename: document.getElementById('export-filename'),
	copyExportBtn: document.getElementById('copy-export-btn'),
	downloadExportBtn: document.getElementById('download-export-btn'),
	toast: document.getElementById('toast'),
	uiThemeDarkBtn: document.getElementById('ui-theme-dark-btn'),
	uiThemeLightBtn: document.getElementById('ui-theme-light-btn'),
};

let hughBridge = null;
let isUpdatingInputs = false;

/**
 * Initialize Application
 */
async function init () {
	// Initialize Hugh Color Picker Bridge
	hughBridge = new HughBridge(els.nativeColorPicker, (oklch, _hex) => {
		if (isUpdatingInputs) return;
		state.baseOklch = { ...oklch };
		updateInputsFromState({ skipPicker: true, skipHex: false });
		render();
	});
	await hughBridge.init();

	setupEventListeners();
	updateInputsFromState();
	render();
}

/**
 * Wire DOM Event Listeners
 */
function setupEventListeners () {
	// Family Selector
	els.familySelect.addEventListener('change', (e) => {
		const fam = e.target.value;
		state.family = fam;
		const def = COLOR_FAMILIES[fam];

		if (def) {
			state.baseOklch = { ...def.defaultOklch };
			updateInputsFromState();
			render();
		}
	});

	// Hex input change
	els.hexInput.addEventListener('input', (e) => {
		if (isUpdatingInputs) return;
		const oklch = hexToOklch(e.target.value);

		if (oklch) {
			state.baseOklch = { ...oklch };
			updateInputsFromState({ skipHex: true });
			render();
		}
	});

	// Lightness slider & input
	const handleLChange = (val) => {
		if (isUpdatingInputs) return;
		const num = parseFloat(val);

		if (!isNaN(num)) {
			state.baseOklch.l = Math.max(0, Math.min(1, num));
			updateInputsFromState();
			render();
		}
	};
	els.sliderL.addEventListener('input', (e) => handleLChange(e.target.value));
	els.inputL.addEventListener('input', (e) => handleLChange(e.target.value));

	// Chroma slider & input
	const handleCChange = (val) => {
		if (isUpdatingInputs) return;
		const num = parseFloat(val);

		if (!isNaN(num)) {
			state.baseOklch.c = Math.max(0, Math.min(0.4, num));
			updateInputsFromState();
			render();
		}
	};
	els.sliderC.addEventListener('input', (e) => handleCChange(e.target.value));
	els.inputC.addEventListener('input', (e) => handleCChange(e.target.value));

	// Hue slider & input
	const handleHChange = (val) => {
		if (isUpdatingInputs) return;
		const num = parseFloat(val);

		if (!isNaN(num)) {
			state.baseOklch.h = (parseFloat(val) % 360 + 360) % 360;
			updateInputsFromState();
			render();
		}
	};
	els.sliderH.addEventListener('input', (e) => handleHChange(e.target.value));
	els.inputH.addEventListener('input', (e) => handleHChange(e.target.value));

	// Auto-tune button
	els.autoNudgeBtn.addEventListener('click', () => {
		autoTuneContrast();
	});

	// Preview mode switches
	const setPreviewMode = (mode) => {
		state.previewMode = mode;
		els.previewLightBtn.classList.toggle('seg-btn--active', mode === 'light');
		els.previewDarkBtn.classList.toggle('seg-btn--active', mode === 'dark');
		els.previewHcBtn.classList.toggle('seg-btn--active', mode === 'hc');
		els.previewForcedBtn.classList.toggle('seg-btn--active', mode === 'forced');
		renderPreviewAndTokens();
	};

	els.previewLightBtn.addEventListener('click', () => setPreviewMode('light'));
	els.previewDarkBtn.addEventListener('click', () => setPreviewMode('dark'));
	els.previewHcBtn.addEventListener('click', () => setPreviewMode('hc'));
	els.previewForcedBtn.addEventListener('click', () => setPreviewMode('forced'));

	// Export tab switches
	const setExportTab = (tab) => {
		state.exportTab = tab;
		els.tabCssBtn.classList.toggle('seg-btn--active', tab === 'css');
		els.tabJsonBtn.classList.toggle('seg-btn--active', tab === 'json');
		els.exportFilename.textContent = tab === 'css'
			? `${state.family}-tokens.css`
			: `${state.family}-tokens.json`;
		renderExportPane();
	};

	els.tabCssBtn.addEventListener('click', () => setExportTab('css'));
	els.tabJsonBtn.addEventListener('click', () => setExportTab('json'));

	// Copy Export Code
	els.copyExportBtn.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(els.codeOutput.textContent);
			showToast('Code copied to clipboard!');
		} catch (_) {
			showToast('Failed to copy to clipboard');
		}
	});

	// Download Export Code
	els.downloadExportBtn.addEventListener('click', () => {
		const content = els.codeOutput.textContent;
		const filename = els.exportFilename.textContent;
		const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	});

	// UI Theme Mode switch
	els.uiThemeDarkBtn.addEventListener('click', () => {
		document.documentElement.setAttribute('data-ui-theme', 'dark');
		els.uiThemeDarkBtn.classList.add('seg-btn--active');
		els.uiThemeLightBtn.classList.remove('seg-btn--active');
	});
	els.uiThemeLightBtn.addEventListener('click', () => {
		document.documentElement.setAttribute('data-ui-theme', 'light');
		els.uiThemeLightBtn.classList.add('seg-btn--active');
		els.uiThemeDarkBtn.classList.remove('seg-btn--active');
	});
}

/**
 * Sync Input controls to state
 */
function updateInputsFromState ({ skipPicker = false, skipHex = false } = {}) {
	isUpdatingInputs = true;
	const { l, c, h } = state.baseOklch;

	els.sliderL.value = l.toFixed(2);
	els.inputL.value = l.toFixed(2);

	els.sliderC.value = c.toFixed(3);
	els.inputC.value = c.toFixed(3);

	els.sliderH.value = Math.round(h);
	els.inputH.value = Math.round(h);

	const hex = oklchToHex(l, c, h);

	if (!skipHex) {
		els.hexInput.value = hex;
	}

	if (!skipPicker) {
		els.nativeColorPicker.value = hex;

		if (hughBridge) {
			hughBridge.setColor(l, c, h);
		}
	}

	isUpdatingInputs = false;
}

/**
 * Auto-tune Lightness and Chroma to maximize WCAG contrast
 */
function autoTuneContrast () {
	// Baseline adjustments for accessibility
	if (state.baseOklch.l < 0.35) {
		state.baseOklch.l = 0.45;
	} else if (state.baseOklch.l > 0.75) {
		state.baseOklch.l = 0.60;
	}
	if (state.baseOklch.c > 0.25) {
		state.baseOklch.c = 0.20;
	}
	updateInputsFromState();
	render();
	showToast('Color auto-tuned for optimal WCAG contrast.');
}

/**
 * Toast notifications
 */
function showToast (msg) {
	els.toast.textContent = msg;
	els.toast.classList.add('toast--visible');
	setTimeout(() => {
		els.toast.classList.remove('toast--visible');
	}, 2500);
}

/**
 * Main Render Pipeline
 */
function render () {
	// Check Gamut
	const srgb = oklchToSrgb(state.baseOklch.l, state.baseOklch.c, state.baseOklch.h);

	if (srgb.inGamut) {
		els.gamutBadge.className = 'badge badge--ok';
		els.gamutBadge.textContent = 'sRGB OK';
	} else {
		els.gamutBadge.className = 'badge badge--warn';
		els.gamutBadge.textContent = 'Gamut Clipped';
	}

	renderPreviewAndTokens();
	renderExportPane();
}

/**
 * Render Tokens Matrix & Live Sandbox
 */
function renderPreviewAndTokens () {
	const isNeutral = state.family === 'neutral';
	const generated = isNeutral
		? generateNeutralTokens(state.baseOklch)
		: generateChromaticTokens(state.family, state.baseOklch);

	// Update Compliance Overview
	els.complianceList.innerHTML = '';

	for (const [, item] of Object.entries(generated.compliance)) {
		const div = document.createElement('div');
		div.className = 'compliance-item';

		const badgeClass = item.passesAAA
			? 'badge--ok'
			: (item.passesAA ? 'badge--ok' : 'badge--fail');
		const badgeText = item.passesAAA
			? `AAA ${item.ratio.toFixed(1)}:1`
			: (item.passesAA ? `AA ${item.ratio.toFixed(1)}:1` : `FAIL ${item.ratio.toFixed(1)}:1`);

		div.innerHTML = `
			<span>${item.name}</span>
			<span class="badge ${badgeClass}">${badgeText}</span>
		`;
		els.complianceList.appendChild(div);
	}

	// Update Token Swatches for current preview mode
	const mode = (state.previewMode === 'dark') ? 'dark' : 'light';
	const tokenDefs = isNeutral
		? generated[mode].semantic
		: generated[mode];

	els.tokenGrid.innerHTML = '';

	for (const [name, token] of Object.entries(tokenDefs)) {
		const card = document.createElement('div');
		card.className = 'token-card';

		const textCol = token.oklch.l > 0.5 ? '#000000' : '#ffffff';

		card.innerHTML = `
			<div class="token-swatch" style="background-color: ${token.cssValue}; color: ${textCol};">
				<span>${token.label || name}</span>
			</div>
			<div class="token-meta">
				<span class="token-meta__name">${name}</span>
				<span class="token-meta__value">${token.cssValue}</span>
				<div class="token-meta__footer">
					<span class="badge ${token.inGamut ? 'badge--ok' : 'badge--warn'}" style="font-size: 0.7rem;">
						${token.inGamut ? 'sRGB' : 'Clipped'}
					</span>
				</div>
			</div>
		`;
		els.tokenGrid.appendChild(card);
	}

	// Update Sandbox Mock Components
	updateSandboxPreview(generated, isNeutral);
}

/**
 * Apply Generated Tokens to Interactive Sandbox
 */
function updateSandboxPreview (generated, isNeutral) {
	const sb = els.previewSandbox;
	const mode = (state.previewMode === 'dark') ? 'dark' : 'light';
	const isHc = state.previewMode === 'hc';
	const isForced = state.previewMode === 'forced';

	if (isForced) {
		sb.style.backgroundColor = 'Canvas';
		sb.style.color = 'CanvasText';
		sb.style.borderColor = 'ButtonBorder';
		sb.style.setProperty('--color-current-role', 'Highlight');
		sb.style.setProperty('--color-on-current-role', 'HighlightText');
		sb.style.setProperty('--color-current-role-container', 'Canvas');
		sb.style.setProperty('--color-on-current-role-container', 'CanvasText');
		sb.style.setProperty('--color-outline', 'ButtonBorder');
		sb.style.setProperty('--color-on-surface', 'CanvasText');
		sb.style.setProperty('--color-on-surface-variant', 'CanvasText');
		return;
	}

	if (isNeutral) {
		const sem = generated[mode].semantic;
		const surfBg = mode === 'light' ? '#fbfcfe' : '#14171f';
		sb.style.backgroundColor = surfBg;
		sb.style.color = sem['--color-on-surface'].cssValue;
		sb.style.borderColor = isHc ? sem['--color-on-surface'].cssValue : sem['--color-outline'].cssValue;

		sb.style.setProperty('--color-current-role', sem['--color-on-surface'].cssValue);
		sb.style.setProperty('--color-on-current-role', sem['--color-inverse-on-surface'].cssValue);
		sb.style.setProperty('--color-current-role-container', sem['--color-outline-variant'].cssValue);
		sb.style.setProperty('--color-on-current-role-container', sem['--color-on-surface'].cssValue);
		sb.style.setProperty('--color-outline', isHc ? sem['--color-on-surface'].cssValue : sem['--color-outline'].cssValue);
		sb.style.setProperty('--color-on-surface', sem['--color-on-surface'].cssValue);
		sb.style.setProperty('--color-on-surface-variant', isHc ? sem['--color-on-surface'].cssValue : sem['--color-on-surface-variant'].cssValue);

		// Surface stack
		document.getElementById('sample-surface-stack').style.display = 'flex';
		const baseL = mode === 'light' ? 0.98 : 0.08;
		const deltaL = mode === 'light' ? -0.04 : 0.05;
		const mult = isHc ? 1.5 : 1.0;
		const h = state.baseOklch.h;

		document.getElementById('sample-surface-stack').style.backgroundColor = formatOklch(baseL, 0.005, h, { percent: true });
		document.getElementById('sample-surface-1').style.backgroundColor = formatOklch(baseL + deltaL * mult, 0.008, h, { percent: true });
		document.getElementById('sample-surface-2').style.backgroundColor = formatOklch(baseL + deltaL * 2 * mult, 0.011, h, { percent: true });
	} else {
		document.getElementById('sample-surface-stack').style.display = 'none';
		const tokens = generated[mode];
		const mainCol = tokens[`--color-${state.family}`].cssValue;
		const onMainCol = tokens[`--color-on-${state.family}`].cssValue;
		const containerCol = tokens[`--color-${state.family}-container`].cssValue;
		const onContainerCol = tokens[`--color-on-${state.family}-container`].cssValue;
		const outlineCol = isHc ? onMainCol : tokens['--color-outline'].cssValue;
		const onSurfVar = isHc ? '#000000' : tokens['--color-on-surface-variant'].cssValue;

		sb.style.backgroundColor = mode === 'light' ? '#ffffff' : '#181c26';
		sb.style.color = mode === 'light' ? '#12151e' : '#f0f3f8';
		sb.style.borderColor = outlineCol;

		sb.style.setProperty('--color-current-role', mainCol);
		sb.style.setProperty('--color-on-current-role', onMainCol);
		sb.style.setProperty('--color-current-role-container', containerCol);
		sb.style.setProperty('--color-on-current-role-container', onContainerCol);
		sb.style.setProperty('--color-outline', outlineCol);
		sb.style.setProperty('--color-on-surface', mode === 'light' ? '#12151e' : '#f0f3f8');
		sb.style.setProperty('--color-on-surface-variant', onSurfVar);
	}
}

/**
 * Render Output CSS / JSON Box
 */
function renderExportPane () {
	const isNeutral = state.family === 'neutral';
	const generated = isNeutral
		? generateNeutralTokens(state.baseOklch)
		: generateChromaticTokens(state.family, state.baseOklch);

	if (state.exportTab === 'css') {
		els.codeOutput.textContent = isNeutral
			? formatNeutralCss(generated)
			: formatChromaticCss(generated);
	} else {
		els.codeOutput.textContent = formatJsonConfig(generated);
	}
}

// Boot
window.addEventListener('DOMContentLoaded', init);
