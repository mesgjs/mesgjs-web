import { setModMeta } from 'https://cdn.jsdelivr.net/gh/mesgjs/mesgjs@0.2.11/dist/runtime-min/mesgjs.esm.js';
setModMeta({"prefixMap":{"mwi/":"https://cdn.jsdelivr.net/gh/mesgjs/mesgjs-web@0.5.9/dist/msjs/mwi/"},"modules":{"mwi/mwi-document":{"integrity":"sha512-q8zcBK078VdqYz3q2f4mArW2qtlIQcuTWvCRvRVEyjiIGMqAOKQkVmliuSuH07rBFoZY2kJEEkxIdOJhKYvIUA==","version":"0.5.0","featpro":["MWIDocument"]},"mwi/mwi-core-comp":{"integrity":"sha512-k8G1nw8TTFPPFR2bBIbN3OShnZjVNeZmsDlehFKWfDrodMQBq5NuJx9dMbcKseaXf1nAkjqydXuOM/b0T1JSug==","version":"0.5.0","featpro":["mwi.comp.MWICore"]},"mwi/mwi-registry":{"integrity":"sha512-Ymxu816EtE72+rYIC1Zmw0Xe5gxEtX6mdY/jsQyDSkkyllmqdXT5JLDEHiDEmqho8HwIe/qK7s3z1WHRyBxmFQ==","version":"0.5.0","featpro":["mwi.compRegOpen","mwi.compRegReady"]},"mwi/mwi-doc-node":{"integrity":"sha512-rS6hagSsJqWGxvEV1Fsrr0NL8xnB2TaqQlA30aQsKz3PbyvOIeDguTAYM2lnXQJ9NtfywnKIEaHhZnXh+EKltw==","version":"0.5.0","featpro":["MWIDocNode"]},"mwi/mwi-html-comp":{"integrity":"sha512-hMVHV/CQEw+sHgxgN2YsQPoohXx4/qyDL32vKLuWpUPeMONdZSMcz7or8kFRCa9t06ZhuWqPl+Ld8OqjDCKnKA==","version":"0.5.0","featpro":["mwi.comp.MWIHTML"]}}});
$c.fwait("@loaded").then(() => {
/**
 * MWI to HTML CLI Tool
 * 
 * Reads an MWI document spec in SLID format and renders it to HTML.
 * Input can be from stdin or a file specified as the first argument.
 * 
 * Usage: 
 *   deno run --allow-read util/mwi-to-html-cli.esm.js <slid-file>
 *   cat spec.slid | deno run --allow-read util/mwi-to-html-cli.esm.js
 * 
 * @module mwi-to-html-cli
 */

const { getInstance } = $c;

/**
 * Read input from stdin
 */
async function readStdin() {
	const decoder = new TextDecoder();
	const text = [];

	for await (const chunk of Deno.stdin.readable) {
		text.push(decoder.decode(chunk));
	}

	return text.join('');
}

/**
 * Main CLI function
 */
async function main() {
	let slidContent;

	// Determine input source
	if (Deno.args.length > 0) {
		// Read from file
		const inputFile = Deno.args[0];
		try {
			slidContent = await Deno.readTextFile(inputFile);
		} catch (error) {
			console.error(`Error reading file '${inputFile}':`, error.message);
			Deno.exit(1);
		}
	} else if (!Deno.stdin.isTerminal()) {
		// Read from stdin
		try {
			slidContent = await readStdin();
		} catch (error) {
			console.error('Error reading from stdin:', error.message);
			Deno.exit(1);
		}
	} else {
		// No input provided
		console.error('Error: No input provided');
		console.error('Usage: deno run --allow-read util/mwi-to-html-cli.esm.js <slid-file>');
		console.error('   or: cat spec.slid | deno run --allow-read util/mwi-to-html-cli.esm.js');
		Deno.exit(1);
	}

	let docSpec;
	try {
		docSpec = NANOS.parseSLID(slidContent);
	} catch (error) {
		console.error('Error parsing SLID content:', error.message);
		Deno.exit(1);
	}

	if (!docSpec.next) {
		console.error('Error: Input is empty');
		Deno.exit(1);
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
		Deno.exit(1);
	}
}

// Run the CLI
if (import.meta.main) {
	main();
}
});
