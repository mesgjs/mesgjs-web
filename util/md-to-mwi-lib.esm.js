/**
 * Markdown to NANOS-for-MWI Conversion Library
 * 
 * Converts markdown content to MWI-compatible NANOS list structures
 * using AST-based transformation for direct markdown-to-MWI conversion.
 * 
 * @module md-to-mwi-lib
 */

import { marked } from "https://esm.sh/marked@11.1.1";
import { NANOS } from "https://cdn.jsdelivr.net/gh/mesgjs/nanos@1.1.2/src/nanos.esm.js";

/**
 * Create a NANOS list from key-value pairs
 * Use empty string for positional values
 * @param {Array} pairs - Alternating key-value pairs
 * @returns {NANOS} NANOS list instance
 */
function ls (pairs) {
	return (new NANOS()).fromPairs(pairs);
}

/**
 * Convert markdown text to MWI spec (NANOS list structure)
 * @param {string} markdownText - Raw markdown content
 * @returns {NANOS} NANOS of list specs
 */
function markdownToMWISpec (markdownText) {
	const tokens = marked.lexer(markdownText);
	const topLevel = new NANOS();
	addTokens(topLevel, tokens);
	return topLevel;
}

/**
 * Add tokens to a NANOS list as positional values
 * Recursively processes tokens and unions their results
 * @param {NANOS} parent - Parent NANOS list to add children to
 * @param {Array} tokens - Tokens to convert and add
 */
function addTokens (parent, tokens) {
	if (!tokens || tokens.length === 0) return;
	
	for (const token of tokens) {
		const results = convertToken(token);
		// Union results into parent
		parent.push(results);
	}
}

/**
 * Convert a single token to MWI spec
 * Unified converter that handles all token types recursively
 * @param {Object} token - Marked token object
 * @returns {NANOS} NANOS list of results (may be empty, single, or multiple items)
 */
function convertToken (token) {
	const results = new NANOS();
	
	switch (token.type) {
		case 'space':
			// Return empty NANOS
			break;

		case 'text':
			// Text tokens with inline children expand to multiple results
			if (token.tokens && token.tokens.length > 0) {
				addTokens(results, token.tokens);
			} else {
				// Plain text - add as single string value
				results.push([token.text]);
			}
			break;

		case 'heading': {
			const spec = ls([, `h.h${token.depth}`]);
			addTokens(spec, token.tokens);
			results.push([spec]);
			break;
		}
			
		case 'paragraph': {
			const spec = ls([, 'h.p']);
			addTokens(spec, token.tokens);
			results.push([spec]);
			break;
		}
			
		case 'strong': {
			const spec = ls([, 'h.strong']);
			addTokens(spec, token.tokens);
			results.push([spec]);
			break;
		}
			
		case 'em': {
			const spec = ls([, 'h.em']);
			addTokens(spec, token.tokens);
			results.push([spec]);
			break;
		}
			
		case 'br':
			results.push([ls([, 'h.br'])]);
			break;
			
		case 'codespan':
			// Warning: token.text is broken (HTML-escaped) for codespan
			results.push([ls([, 'h.code', , trimCodeSpan(token.raw)])]);
			break;
			
		case 'code':
			results.push([ls([, 'h.pre', ,
				ls([, 'h.code',
					'class', `language-${token.lang || 'text'}`,
					, token.text
				])
			])]);
			break;
			
		case 'link': {
			const spec = ls([, 'h.a', 'href', token.href]);
			if (token.title) {
				spec.push(['title', token.title]);
			}
			addTokens(spec, token.tokens);
			results.push([spec]);
			break;
		}
			
		case 'image':
			results.push([ls([, 'h.img',
				'src', token.href,
				'alt', token.text,
				...(token.title ? ['title', token.title] : [])
			])]);
			break;
			
		case 'list': {
			const listTag = token.ordered ? 'h.ol' : 'h.ul';
			const spec = ls([, listTag]);
			for (const item of token.items) {
				const liSpec = ls([, 'h.li']);
				addTokens(liSpec, item.tokens);
				spec.push([liSpec]);
			}
			results.push([spec]);
			break;
		}
			
		case 'list_item': {
			const spec = ls([, 'h.li']);
			addTokens(spec, token.tokens);
			results.push([spec]);
			break;
		}
			
		case 'blockquote': {
			const spec = ls([, 'h.blockquote']);
			addTokens(spec, token.tokens);
			results.push([spec]);
			break;
		}
			
		case 'hr':
			results.push([ls([, 'h.hr'])]);
			break;
			
		case 'html':
			// For MVP: Pass through HTML as-is
			// Future: Parse and convert to MWI components
			results.push([ls([, 'h.pre', , token.text])]);
			break;
			
		case 'table':
			results.push([convertTable(token)]);
			break;
			
		default:
			console.warn(`Unhandled token type: ${token.type}`);
			if (token.text) {
				results.push([token.text]);
			}
			break;
	}
	
	return results;
}


/**
 * Convert table token to MWI spec
 * @param {Object} token - Table token
 * @returns {Object} NANOS list spec
 */
function convertTable (token) {
	const headerCells = token.header.map(cell =>
		ls([, 'h.th', , cell.text])
	);
	
	const bodyRows = token.rows.map(row => {
		const cells = row.map(cell =>
			ls([, 'h.td', , cell.text])
		);
		return ls([, 'h.tr', , ...cells]);
	});
	
	return ls([, 'h.table', ,
		ls([, 'h.thead', ,
			ls([, 'h.tr', , ...headerCells])
		]),
		, ls([, 'h.tbody', , ...bodyRows])
	]);
}

/**
 * 
 * @param {string} raw - Raw codespan content
 * @returns {string} Codespan content de-fenced and trimmed
 */
function trimCodeSpan (raw) {
	const fence = raw.match(/^`+/)[0], fenceSize = fence.length;
	const defenced = raw.slice(fenceSize, -fenceSize);
	return (/^ .*[^ ].* $/.test(defenced) ? defenced.slice(1, -1) : defenced);
}

/**
 * Parse frontmatter from markdown
 * @param {string} markdown - Raw markdown with optional frontmatter
 * @returns {Object} { frontmatter: Object, content: string }
 */
function parseFrontmatter (markdown) {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = markdown.match(frontmatterRegex);
	
	if (!match) {
		return { frontmatter: {}, content: markdown };
	}
	
	const [, frontmatterText, content] = match;
	const frontmatter = {};
	
	// Simple key: value parser
	for (const line of frontmatterText.split('\n')) {
		const [key, ...valueParts] = line.split(':');
		if (key && valueParts.length) {
			frontmatter[key.trim()] = valueParts.join(':').trim();
		}
	}
	
	return { frontmatter, content };
}

export { markdownToMWISpec, parseFrontmatter, NANOS, ls };
