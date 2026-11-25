/**
 * MWI to HTML CLI Tool
 * 
 * Reads an MWI document spec in SLID format and renders it to HTML.
 * Input can be from stdin or a file specified as the first argument.
 * 
 * Usage: 
 *   deno run --allow-read util/mwi-to-html-cli.esm.js <slid-file>
 *   deno run --allow-read util/mwi-to-html-cli.esm.js < spec.slid
 * 
 * @module mwi-to-html-cli
 */

import { args as cliArgs, isTTY } from '@compat/cli';
import { exit } from '@compat/runtime';
import { readTextFile } from '@compat/file';
import { readStdinText } from '@compat/stdin';

const { getInstance } = $c;

/**
 * Main CLI function
 */
export async function main(args = cliArgs()) {
	let slidContent;

	// Determine input source
	if (args.length > 0) {
		// Read from file
		const inputFile = args[0];
		try {
			slidContent = await readTextFile(inputFile);
		} catch (error) {
			console.error(`Error reading file '${inputFile}':`, error.message);
			exit(1);
		}
	} else {
		let tty = true;
		try {
			tty = isTTY('stdin');
		} catch (_) {
			tty = true;
		}

		if (!tty) {
			// Read from stdin
			try {
				slidContent = await readStdinText();
			} catch (error) {
				console.error('Error reading from stdin:', error.message);
				exit(1);
			}
		} else {
			// No input provided
			console.error('Error: No input provided');
			console.error('Usage: deno run --allow-read util/mwi-to-html-cli.esm.js <slid-file>');
			console.error('   or: deno run --allow-read util/mwi-to-html-cli.esm.js < spec.slid');
			exit(1);
		}
	}

	let docSpec;
	try {
		docSpec = NANOS.parseSLID(slidContent);
	} catch (error) {
		console.error('Error parsing SLID content:', error.message);
		exit(1);
	}

	if (!docSpec.next) {
		console.error('Error: Input is empty');
		exit(1);
	}

	// Parse SLID and render to HTML
	try {
		// Render to HTML
		const doc = getInstance('MWIDocument');
		doc.append({ list: docSpec });
		const html = doc('getHTML');

		// Output HTML
		console.log(html);
	} catch (error) {
		console.error('Error rendering MWI spec to HTML:', error.message);
		if (error.stack) {
			console.error(error.stack);
		}
		exit(1);
	}
}

// Run the CLI
if (import.meta.main) {
	main();
}
