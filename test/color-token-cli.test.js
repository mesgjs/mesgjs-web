/**
 * @file color-token-cli.test.js
 * Integration and unit tests for the MWI Color Token Generator CLI.
 */

import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
} from '@std/assert';
import { spawn } from '@compat/subprocess';
import * as path from '@compat/path';
import { fromFileUrl } from '@compat/file';

const __filename = fromFileUrl(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, '../bin/mwi-color-tokens');
const decoder = new TextDecoder();

/**
 * Helper to run the CLI subprocess.
 */
async function runCli (args = [], options = {}) {
	const proc = spawn(CLI_PATH, args, {
		cwd: options.cwd || undefined,
		stdin: options.stdin ? options.stdin : undefined,
	});

	const res = await proc.output();
	return {
		code: res.code,
		success: res.success,
		stdout: decoder.decode(res.stdout),
		stderr: decoder.decode(res.stderr),
	};
}

describe("Color Token CLI - Help and Version Flags", () => {
	it("--help flag outputs usage instructions", async () => {
		const res = await runCli(["--help"]);
		assertEquals(res.code, 0);
		assert(res.stdout.includes("Usage:"));
		assert(res.stdout.includes("--state-config"));
		assert(res.stdout.includes("mwi-color-tokens"));
	});

	it("-h shorthand outputs usage instructions", async () => {
		const res = await runCli(["-h"]);
		assertEquals(res.code, 0);
		assert(res.stdout.includes("Usage:"));
	});

	it("--version flag outputs version info", async () => {
		const res = await runCli(["--version"]);
		assertEquals(res.code, 0);
		assert(res.stdout.includes("mwi-color-tokens v"));
	});
});

describe("Color Token CLI - State Configuration CSS Output", () => {
	it("--state-config outputs standalone root theme state configuration", async () => {
		const res = await runCli(["--state-config"]);
		assertEquals(res.code, 0);
		assert(res.stdout.includes("MWI Theme State Configuration"));
		assert(res.stdout.includes("color-scheme: light dark;"));
		assert(res.stdout.includes("--theme-color-mode: light;"));
		assert(res.stdout.includes("--theme-contrast-mode: standard;"));
		assert(res.stdout.includes("@media (prefers-color-scheme: dark)"));
		assert(res.stdout.includes("@media (prefers-contrast: more)"));
		assert(res.stdout.includes("@media (forced-colors: active)"));
		assert(res.stdout.includes("html[data-theme='light']"));
		assert(res.stdout.includes("html[data-theme='dark']"));
	});

	it("--state shorthand outputs state configuration", async () => {
		const res = await runCli(["--state"]);
		assertEquals(res.code, 0);
		assert(res.stdout.includes("MWI Theme State Configuration"));
	});
});

describe("Color Token CLI - File Input Generation", () => {
	it("Generates Primary chromatic tokens from default-theme/primary.json", async () => {
		const res = await runCli(["default-theme/primary.json"]);
		assertEquals(res.code, 0);
		assert(res.stdout.includes("MWI Theme Tokens: Primary"));
		assert(res.stdout.includes("@container theme-cfg style(--theme-color-mode: light)"));
		assert(res.stdout.includes("@container theme-cfg style(--theme-color-mode: dark)"));
		assert(res.stdout.includes("--color-primary: #"));
		assert(res.stdout.includes("--color-on-primary: #"));
		assert(res.stdout.includes("--color-primary-container: #"));
		assert(res.stdout.includes("--color-on-primary-container: #"));
		assert(res.stdout.includes("--color-primary: Highlight;"));
	});

	it("Generates Neutral surface & typography tokens from default-theme/neutral.json", async () => {
		const res = await runCli(["default-theme/neutral.json"]);
		assertEquals(res.code, 0);
		assert(res.stdout.includes("MWI Theme Tokens: Neutral & Generative Surfaces"));
		assert(res.stdout.includes("--surface-base-l: 98%;"));
		assert(res.stdout.includes("--surface-base-c: 0.005;"));
		assert(res.stdout.includes("--surface-base-h: 260;"));
		assert(res.stdout.includes("--color-on-surface: #"));
		assert(res.stdout.includes("--color-outline: #"));
		assert(res.stdout.includes("@container theme-cfg style(--theme-contrast-mode: high)"));
		assert(res.stdout.includes("@container theme-cfg style(--theme-contrast-mode: forced)"));
	});

	it("Supports -i / --input option flag", async () => {
		const res = await runCli(["--input", "default-theme/secondary.json"]);
		assertEquals(res.code, 0);
		assert(res.stdout.includes("MWI Theme Tokens: Secondary"));
		assert(res.stdout.includes("--color-secondary: #"));
	});
});

describe("Color Token CLI - Stdin Piping and Anchored Mode", () => {
	it("Reads JSON config from stdin via '-' argument", async () => {
		const jsonInput = JSON.stringify({
			version: "1.0",
			family: "success",
			strategy: "tonal",
			base: {
				space: "oklch",
				l: 0.62,
				c: 0.17,
				h: 142,
			},
		});

		const res = await runCli(["-"], { stdin: jsonInput });
		assertEquals(res.code, 0);
		assert(res.stdout.includes("MWI Theme Tokens: Success"));
		assert(res.stdout.includes("--color-success: #"));
		assert(res.stdout.includes("--color-on-success: #"));
	});

	it("Generates Anchored brand mode tokens with custom tuning", async () => {
		const brandHex = "#0052CC";
		const jsonInput = JSON.stringify({
			version: "1.0",
			family: "primary",
			strategy: "anchored",
			anchorHex: brandHex,
			tuning: {
				containerChromaFactor: 0.40,
				darkTargetLightness: 0.78,
			},
		});

		const res = await runCli(["-"], { stdin: jsonInput });
		assertEquals(res.code, 0);
		assert(res.stdout.includes("MWI Theme Tokens: Primary (Anchored Brand Mode)"));
		assert(res.stdout.includes(`--color-primary: ${brandHex};`));
		assert(res.stdout.includes("Strategy: anchored"));
	});
});

describe("Color Token CLI - Error Handling", () => {
	it("Fails gracefully when input file does not exist", async () => {
		const res = await runCli(["non-existent-theme.json"]);
		assertEquals(res.code, 1);
		assert(res.stderr.includes("Error reading file 'non-existent-theme.json'"));
	});

	it("Fails gracefully on malformed JSON", async () => {
		const res = await runCli(["-"], { stdin: "not valid json { " });
		assertEquals(res.code, 1);
		assert(res.stderr.includes("Error: Invalid JSON format"));
	});

	it("Fails gracefully on unknown color family", async () => {
		const badFamilyJson = JSON.stringify({
			family: "invalid-family-name",
			base: "oklch(0.5 0.1 100)",
		});
		const res = await runCli(["-"], { stdin: badFamilyJson });
		assertEquals(res.code, 1);
		assert(res.stderr.includes("Invalid or missing \"family\""));
	});

	it("Fails gracefully on unknown command-line option", async () => {
		const res = await runCli(["--invalid-option"]);
		assertEquals(res.code, 1);
		assert(res.stderr.includes("Unknown option '--invalid-option'"));
	});
});
