import {
    assertEquals
} from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { MWICssProcessorService } from 'mesgjs-web/src/server/services/MWICssProcessorService.esm.js';

Deno.test('MWICssProcessorService - generates scoped CSS', () => {
    const cssProcessor = new MWICssProcessorService();
    const cssMap = new Map([
        ['mwi-0-', '.@@container { color: red; }'],
        ['mwi-1-', '.@@button { color: blue; }']
    ]);

    const expectedCss = [
        '.mwi-0-container { color: red; }',
        '.mwi-1-button { color: blue; }'
    ].join('\n');

    const actualCss = cssProcessor.generateScopedCss(cssMap);
    assertEquals(actualCss.trim(), expectedCss.trim());
});

Deno.test('MWICssProcessorService - handles empty map', () => {
    const cssProcessor = new MWICssProcessorService();
    const cssMap = new Map();
    const actualCss = cssProcessor.generateScopedCss(cssMap);
    assertEquals(actualCss, '');
});

Deno.test('MWICssProcessorService - handles multiple placeholders', () => {
    const cssProcessor = new MWICssProcessorService();
    const cssMap = new Map([
        ['mwi-a-', 'p.@@ { color: red; } span.@@ { font-weight: bold; }']
    ]);
    const expectedCss = 'p.mwi-a- { color: red; } span.mwi-a- { font-weight: bold; }';
    const actualCss = cssProcessor.generateScopedCss(cssMap);
    assertEquals(actualCss, expectedCss);
});