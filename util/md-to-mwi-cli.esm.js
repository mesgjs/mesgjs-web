#!/usr/bin/env -S deno run --allow-read
/**
 * Markdown to MWI CLI Tool
 * 
 * Reads a Markdown file and converts it to NANOS-based MWI spec,
 * outputting the result in compact SLID format.
 * 
 * Usage: deno run --allow-read util/md-to-mwi-cli.esm.js <markdown-file>
 * 
 * @module md-to-mwi-cli
 */

import { markdownToMWISpec, parseFrontmatter } from './md-to-mwi-lib.esm.js';

/**
 * Main CLI function
 */
function main() {
	// Check for required argument
	if (Deno.args.length === 0) {
		console.error('Error: No input file specified');
		console.error('Usage: deno run --allow-read util/md-to-mwi-cli.esm.js <markdown-file>');
		Deno.exit(1);
	}

	const inputFile = Deno.args[0];

	// Read the markdown file
	let markdownContent;
	try {
		markdownContent = Deno.readTextFileSync(inputFile);
	} catch (error) {
		console.error(`Error reading file '${inputFile}':`, error.message);
		Deno.exit(1);
	}

	// Parse frontmatter if present
	const { frontmatter, content } = parseFrontmatter(markdownContent);

	// Convert markdown to MWI spec
	let mwiSpec;
	try {
		mwiSpec = markdownToMWISpec(content);
	} catch (error) {
		console.error('Error converting markdown to MWI spec:', error.message);
		Deno.exit(1);
	}

	// Output in compact SLID format
	try {
		const slidOutput = mwiSpec.toSLID({ compact: true });
		console.log(slidOutput);
	} catch (error) {
		console.error('Error generating SLID output:', error.message);
		Deno.exit(1);
	}

	// If frontmatter was present, output it as a comment to stderr
	if (Object.keys(frontmatter).length > 0) {
		console.error('\n# Frontmatter detected:');
		console.error(JSON.stringify(frontmatter, null, 2));
	}
}

// Run the CLI
if (import.meta.main) {
	main();
}
