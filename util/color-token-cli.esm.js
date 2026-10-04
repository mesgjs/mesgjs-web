#!/usr/bin/env -S deno run --allow-read
/**
 * @file color-token-cli.esm.js
 * Command-line interface for the MWI Color Token Generator.
 *
 * Generates modular CSS custom properties for MWI themes from JSON configuration
 * files or outputs the standalone root theme state configuration CSS.
 *
 * Usage:
 *   deno run --allow-read util/color-token-cli.esm.js [options] [config-file.json]
 *   mwi-color-tokens [options] [config-file.json]
 *
 * Options:
 *   --state-config, --state   Output root theme state configuration CSS
 *   -i, --input <file>        Input JSON configuration file path
 *   -h, --help                Display help information and exit
 *   -v, --version             Display version information and exit
 */

import {
	formatThemeStateConfigCss,
	formatChromaticCss,
	formatNeutralCss,
	parseAndValidateJsonConfig,
} from './color-token-generator/js/token-exporter.esm.js';

import {
	generateTokens,
} from './color-token-generator/js/role-recipes.esm.js';

const VERSION = '1.0.0';

/**
 * Print CLI usage and help message.
 */
function printHelp () {
	console.log(`MWI Color Token Generator CLI v${VERSION}

Usage:
  mwi-color-tokens [options] [config-file.json]
  deno run --allow-read util/color-token-cli.esm.js [options] [config-file.json]

Options:
  --state-config, --state   Output root theme state configuration CSS to stdout
  -i, --input <file>        Specify input JSON configuration file path
  -h, --help                Display this help message and exit
  -v, --version             Display version and exit

Examples:
  # Generate theme state configuration CSS
  mwi-color-tokens --state-config > dist/default-theme/state.css

  # Generate CSS for a chromatic family
  mwi-color-tokens default-theme/primary.json > dist/default-theme/primary.css

  # Generate CSS from standard input
  cat default-theme/neutral.json | mwi-color-tokens - > dist/default-theme/neutral.css
`);
}

/**
 * Read text content from standard input synchronously.
 * @returns {string}
 */
function readStdinSync () {
	const decoder = new TextDecoder();
	const chunks = [];
	const buffer = new Uint8Array(4096);

	try {
		while (true) {
			const bytesRead = Deno.stdin.readSync(buffer);
			if (bytesRead === null || bytesRead === 0) {
				break;
			}
			chunks.push(buffer.subarray(0, bytesRead));
		}
	} catch (err) {
		console.error(`Error reading from stdin: ${err.message}`);
		Deno.exit(1);
	}

	const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
	const concatenated = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		concatenated.set(chunk, offset);
		offset += chunk.length;
	}

	return decoder.decode(concatenated);
}

/**
 * Main CLI entrypoint.
 */
export function main (args = Deno.args) {
	let inputFile = null;
	let stateConfigMode = false;

	// Parse command-line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === '--help' || arg === '-h') {
			printHelp();
			return;
		}

		if (arg === '--version' || arg === '-v') {
			console.log(`mwi-color-tokens v${VERSION}`);
			return;
		}

		if (arg === '--state-config' || arg === '--state') {
			stateConfigMode = true;
			continue;
		}

		if (arg === '-i' || arg === '--input') {
			if (i + 1 < args.length) {
				inputFile = args[++i];
			} else {
				console.error('Error: Flag --input requires a file path argument.');
				Deno.exit(1);
			}
			continue;
		}

		if (arg.startsWith('--input=')) {
			inputFile = arg.slice('--input='.length);
			continue;
		}

		if (!arg.startsWith('-') || arg === '-') {
			if (!inputFile) {
				inputFile = arg;
			}
		} else {
			console.error(`Error: Unknown option '${arg}'. Use --help for usage.`);
			Deno.exit(1);
		}
	}

	// 1. Output Theme State Configuration CSS if requested
	if (stateConfigMode) {
		const stateCss = formatThemeStateConfigCss();
		console.log(stateCss.trimEnd());
		return;
	}

	// 2. Read JSON configuration content
	let jsonContent = '';

	if (inputFile === '-') {
		jsonContent = readStdinSync();
	} else if (inputFile) {
		try {
			jsonContent = Deno.readTextFileSync(inputFile);
		} catch (err) {
			console.error(`Error reading file '${inputFile}': ${err.message}`);
			Deno.exit(1);
		}
	} else {
		// Check if stdin has piped data
		let isTty = true;
		try {
			isTty = Deno.isatty ? Deno.isatty(Deno.stdin.rid) : (Deno.stdin.isTerminal ? Deno.stdin.isTerminal() : true);
		} catch (_) {
			isTty = true;
		}

		if (!isTty) {
			jsonContent = readStdinSync();
		} else {
			console.error('Error: No input configuration file specified.');
			console.error('Use mwi-color-tokens --help for usage instructions.');
			Deno.exit(1);
		}
	}

	if (!jsonContent.trim()) {
		console.error('Error: Input configuration is empty.');
		Deno.exit(1);
	}

	// 3. Parse and validate JSON config
	const validation = parseAndValidateJsonConfig(jsonContent);
	if (!validation.valid) {
		console.error(`Error: ${validation.error}`);
		Deno.exit(1);
	}

	const config = validation.config;

	// 4. Generate tokens based on family and strategy
	const baseOrAnchor = config.strategy === 'anchored'
		? (config.anchorOklch || config.baseOklch)
		: config.baseOklch;

	const generated = generateTokens(config.family, baseOrAnchor, config);

	// 5. Format CSS output
	let cssOutput = '';
	if (config.family === 'neutral') {
		cssOutput = formatNeutralCss(generated);
	} else {
		cssOutput = formatChromaticCss(generated);
	}

	console.log(cssOutput.trimEnd());
}

if (import.meta.main) {
	main();
}
