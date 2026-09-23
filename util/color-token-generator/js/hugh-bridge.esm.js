/**
 * @file hugh-bridge.esm.js
 * Integration wrapper for the Hugh Color Picker.
 * Dynamically loads Hugh via bare specifier '@hugh' resolved by HTML importmap.
 */

import { oklchToHex, hexToOklch } from './color-engine.esm.js';

export class HughBridge {
	constructor (inputElement, onColorChange) {
		this.input = inputElement;
		this.onColorChange = onColorChange;
		this.hughInstance = null;
		this.isLoaded = false;
	}

	async init () {
		try {
			const module = await import('@hugh');
			const Hugh = module?.Hugh || module?.default;

			if (Hugh) {
				this.hughInstance = new Hugh({
					input: this.input,
					pickMode: 'auto-hsl',
					format: 'hex',
					continuous: true,
					showText: 'oklch',
				}).attach();

				this.input.addEventListener('input', (e) => {
					this._handleInputChange(e.target.value);
				});

				this.input.addEventListener('change', (e) => {
					this._handleInputChange(e.target.value);
				});

				this.isLoaded = true;
				return true;
			}
		} catch (err) {
			console.warn('Hugh color picker could not be loaded from CDN. Using standard fallback controls.', err);
		}

		// Fallback if Hugh is not loaded
		this.input.addEventListener('input', (e) => {
			this._handleInputChange(e.target.value);
		});
		this.input.addEventListener('change', (e) => {
			this._handleInputChange(e.target.value);
		});

		return false;
	}

	_handleInputChange (hexValue) {
		const oklch = hexToOklch(hexValue);

		if (oklch && typeof this.onColorChange === 'function') {
			this.onColorChange(oklch, hexValue);
		}
	}

	setColor (l, c, h) {
		const hex = oklchToHex(l, c, h);

		if (this.input && this.input.value !== hex) {
			this.input.value = hex;
		}
		if (this.hughInstance) {
			this.input.dispatchEvent(new Event('code'));
		}
	}
}
