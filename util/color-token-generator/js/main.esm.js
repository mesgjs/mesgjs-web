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
	DEFAULT_BRAND_TUNING,
	generateTokens,
	generateChromaticTokens,
	generateNeutralTokens,
	generateAnchoredChromaticTokens,
} from './role-recipes.esm.js';

import {
	formatThemeStateConfigCss,
	formatChromaticCss,
	formatNeutralCss,
	formatJsonConfig,
	parseAndValidateJsonConfig,
} from './token-exporter.esm.js';

import { HughBridge } from './hugh-bridge.esm.js';

// Application State
const state = {
	family: 'primary',
	strategy: 'tonal', // 'tonal' | 'anchored'
	baseOklch: { l: 0.55, c: 0.18, h: 260 },
	darkAnchorOklch: null,
	useDarkAnchor: false,
	tuning: { ...DEFAULT_BRAND_TUNING },
	tuningDrawerOpen: true,
	previewMode: 'light', // 'light' | 'dark' | 'hc' | 'forced'
	exportTab: 'color-css', // 'color-css' | 'state-css' | 'json'
	uiTheme: 'dark',
	lastGenerated: null,
};

// DOM References
const els = {
	familySelect: document.getElementById('family-select'),
	strategyGroup: document.getElementById('strategy-group'),
	strategyTonalBtn: document.getElementById('strategy-tonal-btn'),
	strategyAnchoredBtn: document.getElementById('strategy-anchored-btn'),
	baseColorLabel: document.getElementById('base-color-label'),
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
	diagnosticBanner: document.getElementById('diagnostic-banner'),
	diagnosticMessage: document.getElementById('diagnostic-message'),
	diagnosticAutotuneBtn: document.getElementById('diagnostic-autotune-btn'),
	brandTuningSection: document.getElementById('brand-tuning-section'),
	brandTuningToggle: document.getElementById('brand-tuning-toggle'),
	brandTuningBody: document.getElementById('brand-tuning-body'),
	tuningToggleIcon: document.getElementById('tuning-toggle-icon'),
	sliderTint: document.getElementById('slider-tint'),
	inputTint: document.getElementById('input-tint'),
	sliderContL: document.getElementById('slider-cont-l'),
	inputContL: document.getElementById('input-cont-l'),
	sliderDarkL: document.getElementById('slider-dark-l'),
	inputDarkL: document.getElementById('input-dark-l'),
	darkAnchorEnableChk: document.getElementById('dark-anchor-enable-chk'),
	darkAnchorPickerWrap: document.getElementById('dark-anchor-picker-wrap'),
	darkNativeColorPicker: document.getElementById('dark-native-color-picker'),
	darkHexInput: document.getElementById('dark-hex-input'),
	sliderPartnerC: document.getElementById('slider-partner-c'),
	inputPartnerC: document.getElementById('input-partner-c'),
	contrastAaBtn: document.getElementById('contrast-aa-btn'),
	contrastAaaBtn: document.getElementById('contrast-aaa-btn'),
	complianceList: document.getElementById('compliance-list'),
	tokenGrid: document.getElementById('token-grid'),
	previewSandbox: document.getElementById('preview-sandbox'),
	previewLightBtn: document.getElementById('preview-light-btn'),
	previewDarkBtn: document.getElementById('preview-dark-btn'),
	previewHcBtn: document.getElementById('preview-hc-btn'),
	previewForcedBtn: document.getElementById('preview-forced-btn'),
	tabCssBtn: document.getElementById('tab-css-btn'),
	tabStateBtn: document.getElementById('tab-state-btn'),
	tabJsonBtn: document.getElementById('tab-json-btn'),
	codeOutput: document.getElementById('code-output'),
	exportFilename: document.getElementById('export-filename'),
	importJsonBtn: document.getElementById('import-json-btn'),
	copyExportBtn: document.getElementById('copy-export-btn'),
	downloadExportBtn: document.getElementById('download-export-btn'),
	importModal: document.getElementById('import-modal'),
	modalCloseBtn: document.getElementById('modal-close-btn'),
	modalCancelBtn: document.getElementById('modal-cancel-btn'),
	modalApplyBtn: document.getElementById('modal-apply-btn'),
	importFileInput: document.getElementById('import-file-input'),
	importJsonTextarea: document.getElementById('import-json-textarea'),
	importErrorMsg: document.getElementById('import-error-msg'),
	toast: document.getElementById('toast'),
	uiThemeDarkBtn: document.getElementById('ui-theme-dark-btn'),
	uiThemeLightBtn: document.getElementById('ui-theme-light-btn'),
};

let hughBridge = null;
let darkHughBridge = null;
let isUpdatingInputs = false;

/**
 * Set the tool UI theme mode
 */
function setUiTheme (theme) {
	state.uiTheme = theme;
	document.documentElement.setAttribute('data-ui-theme', theme);
	els.uiThemeLightBtn.classList.toggle('seg-btn--active', theme === 'light');
	els.uiThemeDarkBtn.classList.toggle('seg-btn--active', theme === 'dark');
}

/**
 * Set Generation Strategy ('tonal' | 'anchored')
 */
function setStrategy (strategy) {
	state.strategy = strategy;
	els.strategyTonalBtn.classList.toggle('seg-btn--active', strategy === 'tonal');
	els.strategyAnchoredBtn.classList.toggle('seg-btn--active', strategy === 'anchored');

	if (strategy === 'anchored') {
		els.baseColorLabel.textContent = 'Anchor Brand Color (Exact Light Base)';
	} else {
		els.baseColorLabel.textContent = 'Base Color (Seed Hue & Chroma)';
	}

	updateDrawerVisibility();
	render();
}

/**
 * Toggle Drawer visibility based on current family and strategy
 */
function updateDrawerVisibility () {
	const isAnchoredChromatic = state.strategy === 'anchored' && state.family !== 'neutral';
	els.brandTuningSection.style.display = isAnchoredChromatic ? 'block' : 'none';

	if (state.family === 'neutral') {
		els.strategyGroup.style.display = 'none';
	} else {
		els.strategyGroup.style.display = 'flex';
	}
}

/**
 * Initialize Application
 */
async function init () {
	// Determine initial UI theme based on system preference
	const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	setUiTheme(prefersDark ? 'dark' : 'light');

	// Initialize Hugh Color Picker Bridges
	hughBridge = new HughBridge(els.nativeColorPicker, (oklch, _hex) => {
		if (isUpdatingInputs) return;
		state.baseOklch = { ...oklch };
		updateInputsFromState({ skipPicker: true, skipHex: false });
		render();
	});
	await hughBridge.init();

	darkHughBridge = new HughBridge(els.darkNativeColorPicker, (oklch, hex) => {
		if (isUpdatingInputs) return;
		state.darkAnchorOklch = { ...oklch };
		els.darkHexInput.value = hex;
		render();
	});
	await darkHughBridge.init();

	setupEventListeners();
	updateInputsFromState();
	updateTuningInputs();
	updateDrawerVisibility();
	render();
}

/**
 * Wire DOM Event Listeners
 */
function setupEventListeners () {
	// Strategy Switches
	els.strategyTonalBtn.addEventListener('click', () => setStrategy('tonal'));
	els.strategyAnchoredBtn.addEventListener('click', () => setStrategy('anchored'));

	// Family Selector
	els.familySelect.addEventListener('change', (e) => {
		const fam = e.target.value;
		state.family = fam;
		const def = COLOR_FAMILIES[fam];

		if (def) {
			state.baseOklch = { ...def.defaultOklch };
			updateInputsFromState();
			updateDrawerVisibility();
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

	// Brand Tuning Accordion Toggle
	els.brandTuningToggle.addEventListener('click', () => {
		state.tuningDrawerOpen = !state.tuningDrawerOpen;
		els.brandTuningBody.style.display = state.tuningDrawerOpen ? 'flex' : 'none';
		els.tuningToggleIcon.style.transform = state.tuningDrawerOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
	});

	// Brand Tuning Knobs
	const handleTintChange = (val) => {
		if (isUpdatingInputs) return;
		const num = parseFloat(val);
		if (!isNaN(num)) {
			state.tuning.containerChromaFactor = Math.max(0.05, Math.min(1.0, num));
			updateTuningInputs();
			render();
		}
	};
	els.sliderTint.addEventListener('input', (e) => handleTintChange(e.target.value));
	els.inputTint.addEventListener('input', (e) => handleTintChange(e.target.value));

	const handleContLChange = (val) => {
		if (isUpdatingInputs) return;
		const num = parseFloat(val);
		if (!isNaN(num)) {
			state.tuning.containerLightness = Math.max(0.5, Math.min(0.99, num));
			updateTuningInputs();
			render();
		}
	};
	els.sliderContL.addEventListener('input', (e) => handleContLChange(e.target.value));
	els.inputContL.addEventListener('input', (e) => handleContLChange(e.target.value));

	const handleDarkLChange = (val) => {
		if (isUpdatingInputs) return;
		const num = parseFloat(val);
		if (!isNaN(num)) {
			state.tuning.darkTargetLightness = Math.max(0.5, Math.min(0.99, num));
			updateTuningInputs();
			render();
		}
	};
	els.sliderDarkL.addEventListener('input', (e) => handleDarkLChange(e.target.value));
	els.inputDarkL.addEventListener('input', (e) => handleDarkLChange(e.target.value));

	// Explicit Dark Anchor Controls
	els.darkAnchorEnableChk.addEventListener('change', (e) => {
		state.useDarkAnchor = e.target.checked;
		els.darkAnchorPickerWrap.style.display = state.useDarkAnchor ? 'flex' : 'none';
		if (state.useDarkAnchor && !state.darkAnchorOklch) {
			const hex = els.darkHexInput.value || '#9FB5FF';
			state.darkAnchorOklch = hexToOklch(hex);
		}
		render();
	});

	const handleDarkAnchorColorChange = (hex) => {
		const oklch = hexToOklch(hex);
		if (oklch) {
			state.darkAnchorOklch = { ...oklch };
			els.darkNativeColorPicker.value = hex;
			els.darkHexInput.value = hex;
			render();
		}
	};

	els.darkNativeColorPicker.addEventListener('input', (e) => {
		handleDarkAnchorColorChange(e.target.value);
	});
	els.darkHexInput.addEventListener('input', (e) => {
		handleDarkAnchorColorChange(e.target.value);
	});

	const handlePartnerCChange = (val) => {
		if (isUpdatingInputs) return;
		const num = parseFloat(val);
		if (!isNaN(num)) {
			state.tuning.partnerChroma = Math.max(0.0, Math.min(0.1, num));
			updateTuningInputs();
			render();
		}
	};
	els.sliderPartnerC.addEventListener('input', (e) => handlePartnerCChange(e.target.value));
	els.inputPartnerC.addEventListener('input', (e) => handlePartnerCChange(e.target.value));

	// Contrast Target Toggle
	els.contrastAaBtn.addEventListener('click', () => {
		state.tuning.minContrastRatio = 4.5;
		els.contrastAaBtn.classList.add('seg-btn--active');
		els.contrastAaaBtn.classList.remove('seg-btn--active');
		render();
	});

	els.contrastAaaBtn.addEventListener('click', () => {
		state.tuning.minContrastRatio = 7.0;
		els.contrastAaaBtn.classList.add('seg-btn--active');
		els.contrastAaBtn.classList.remove('seg-btn--active');
		render();
	});

	// Auto-tune button
	els.autoNudgeBtn.addEventListener('click', () => {
		autoTuneContrast();
	});

	// Diagnostic auto-tune button
	els.diagnosticAutotuneBtn.addEventListener('click', () => {
		if (state.lastGenerated?.diagnostics?.suggestedAdjustment) {
			const adj = state.lastGenerated.diagnostics.suggestedAdjustment;
			state.baseOklch = { ...adj.adjustedOklch };
			updateInputsFromState();
			render();
			showToast(`Anchor adjusted ${adj.direction} by ${Math.abs(adj.deltaL * 100).toFixed(1)}% L for ${state.tuning.minContrastRatio}:1.`);
		}
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
		els.tabCssBtn.classList.toggle('seg-btn--active', tab === 'color-css');
		els.tabStateBtn.classList.toggle('seg-btn--active', tab === 'state-css');
		els.tabJsonBtn.classList.toggle('seg-btn--active', tab === 'json');

		if (tab === 'color-css') {
			els.exportFilename.textContent = `${state.family}-tokens.css`;
		} else if (tab === 'state-css') {
			els.exportFilename.textContent = 'theme-state-config.css';
		} else {
			els.exportFilename.textContent = `${state.family}-tokens.json`;
		}
		renderExportPane();
	};

	els.tabCssBtn.addEventListener('click', () => setExportTab('color-css'));
	els.tabStateBtn.addEventListener('click', () => setExportTab('state-css'));
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

	// JSON Import Modal Handling
	const openModal = () => {
		els.importJsonTextarea.value = '';
		els.importFileInput.value = '';
		els.importErrorMsg.style.display = 'none';
		els.importModal.style.display = 'flex';
	};

	const closeModal = () => {
		els.importModal.style.display = 'none';
	};

	els.importJsonBtn.addEventListener('click', openModal);
	els.modalCloseBtn.addEventListener('click', closeModal);
	els.modalCancelBtn.addEventListener('click', closeModal);
	els.importModal.addEventListener('click', (e) => {
		if (e.target === els.importModal) closeModal();
	});

	els.importFileInput.addEventListener('change', (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (evt) => {
			els.importJsonTextarea.value = evt.target.result;
		};
		reader.readAsText(file);
	});

	els.modalApplyBtn.addEventListener('click', () => {
		const jsonText = els.importJsonTextarea.value.trim();
		const result = parseAndValidateJsonConfig(jsonText);

		if (!result.valid) {
			els.importErrorMsg.textContent = result.error || 'Invalid configuration JSON.';
			els.importErrorMsg.style.display = 'block';
			return;
		}

		const cfg = result.config;
		state.family = cfg.family;
		els.familySelect.value = cfg.family;
		state.strategy = cfg.strategy;

		if (cfg.strategy === 'anchored') {
			state.baseOklch = { ...cfg.anchorOklch };
			state.tuning = { ...DEFAULT_BRAND_TUNING, ...cfg.tuning };
			if (cfg.darkAnchorOklch) {
				state.useDarkAnchor = true;
				state.darkAnchorOklch = { ...cfg.darkAnchorOklch };
				const darkHex = oklchToHex(cfg.darkAnchorOklch.l, cfg.darkAnchorOklch.c, cfg.darkAnchorOklch.h);
				els.darkHexInput.value = darkHex;
				els.darkNativeColorPicker.value = darkHex;
				els.darkAnchorEnableChk.checked = true;
				els.darkAnchorPickerWrap.style.display = 'flex';
			} else {
				state.useDarkAnchor = false;
				state.darkAnchorOklch = null;
				els.darkAnchorEnableChk.checked = false;
				els.darkAnchorPickerWrap.style.display = 'none';
			}
		} else {
			state.baseOklch = { ...cfg.baseOklch };
			state.useDarkAnchor = false;
			state.darkAnchorOklch = null;
			els.darkAnchorEnableChk.checked = false;
			els.darkAnchorPickerWrap.style.display = 'none';
		}

		setStrategy(cfg.strategy);
		updateInputsFromState();
		updateTuningInputs();
		closeModal();
		render();
		showToast(`Imported ${cfg.family} configuration (${cfg.strategy} mode) successfully!`);
	});

	// UI Theme Mode switch
	els.uiThemeLightBtn.addEventListener('click', () => setUiTheme('light'));
	els.uiThemeDarkBtn.addEventListener('click', () => setUiTheme('dark'));
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
 * Sync Tuning inputs to state
 */
function updateTuningInputs () {
	isUpdatingInputs = true;
	const { containerChromaFactor, containerLightness, darkTargetLightness, partnerChroma, minContrastRatio } = state.tuning;

	els.sliderTint.value = containerChromaFactor.toFixed(2);
	els.inputTint.value = containerChromaFactor.toFixed(2);

	els.sliderContL.value = containerLightness.toFixed(2);
	els.inputContL.value = containerLightness.toFixed(2);

	els.sliderDarkL.value = darkTargetLightness.toFixed(2);
	els.inputDarkL.value = darkTargetLightness.toFixed(2);

	els.sliderPartnerC.value = partnerChroma.toFixed(3);
	els.inputPartnerC.value = partnerChroma.toFixed(3);

	els.contrastAaBtn.classList.toggle('seg-btn--active', minContrastRatio <= 4.5);
	els.contrastAaaBtn.classList.toggle('seg-btn--active', minContrastRatio > 4.5);

	isUpdatingInputs = false;
}

/**
 * Auto-tune Lightness and Chroma to maximize WCAG contrast (Tonal mode legacy button)
 */
function autoTuneContrast () {
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
	const generated = generateTokens(state.family, state.baseOklch, {
		strategy: state.strategy,
		tuning: state.tuning,
		darkAnchorOklch: state.useDarkAnchor ? state.darkAnchorOklch : null,
	});
	state.lastGenerated = generated;

	// Update Mid-tone Warning Banner in Anchored Mode
	if (state.strategy === 'anchored' && !isNeutral && generated.diagnostics?.isMidToneWarning) {
		const lightHex = oklchToHex(state.baseOklch.l, state.baseOklch.c, state.baseOklch.h);
		els.diagnosticMessage.textContent = `⚠️ Anchor ${lightHex} cannot meet ${state.tuning.minContrastRatio}:1 against text (Max achievable: ${generated.diagnostics.maxPossibleRatio.toFixed(1)}:1).`;
		els.diagnosticAutotuneBtn.textContent = `✨ Auto-tune to ${state.tuning.minContrastRatio}:1`;
		els.diagnosticBanner.style.display = 'flex';
	} else {
		els.diagnosticBanner.style.display = 'none';
	}

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
		const neuTokens = generateNeutralTokens(COLOR_FAMILIES.neutral.defaultOklch);
		const semNeu = neuTokens[mode].semantic;

		const mainCol = tokens[`--color-${state.family}`].cssValue;
		const onMainCol = tokens[`--color-on-${state.family}`].cssValue;
		const containerCol = tokens[`--color-${state.family}-container`].cssValue;
		const onContainerCol = tokens[`--color-on-${state.family}-container`].cssValue;

		const outlineCol = isHc ? semNeu['--color-on-surface'].cssValue : semNeu['--color-outline'].cssValue;
		const onSurfCol = semNeu['--color-on-surface'].cssValue;
		const onSurfVar = isHc ? semNeu['--color-on-surface'].cssValue : semNeu['--color-on-surface-variant'].cssValue;

		sb.style.backgroundColor = mode === 'light' ? '#ffffff' : '#181c26';
		sb.style.color = onSurfCol;
		sb.style.borderColor = outlineCol;

		sb.style.setProperty('--color-current-role', mainCol);
		sb.style.setProperty('--color-on-current-role', onMainCol);
		sb.style.setProperty('--color-current-role-container', containerCol);
		sb.style.setProperty('--color-on-current-role-container', onContainerCol);
		sb.style.setProperty('--color-outline', outlineCol);
		sb.style.setProperty('--color-on-surface', onSurfCol);
		sb.style.setProperty('--color-on-surface-variant', onSurfVar);
	}
}

/**
 * Render Output CSS / JSON Box
 */
function renderExportPane () {
	const isNeutral = state.family === 'neutral';
	const generated = state.lastGenerated || (isNeutral
		? generateNeutralTokens(state.baseOklch)
		: generateTokens(state.family, state.baseOklch, {
			strategy: state.strategy,
			tuning: state.tuning,
			darkAnchorOklch: state.useDarkAnchor ? state.darkAnchorOklch : null,
		}));

	if (state.exportTab === 'color-css') {
		els.exportFilename.textContent = `${state.family}-tokens.css`;
		els.codeOutput.textContent = isNeutral
			? formatNeutralCss(generated)
			: formatChromaticCss(generated);
	} else if (state.exportTab === 'state-css') {
		els.exportFilename.textContent = 'theme-state-config.css';
		els.codeOutput.textContent = formatThemeStateConfigCss();
	} else {
		els.exportFilename.textContent = `${state.family}-tokens.json`;
		els.codeOutput.textContent = formatJsonConfig(generated);
	}
}

// Boot
window.addEventListener('DOMContentLoaded', init);
