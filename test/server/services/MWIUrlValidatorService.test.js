import {
    assertEquals
} from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { MWIUrlValidatorService } from 'mesgjs-web/src/server/services/MWIUrlValidatorService.esm.js';

Deno.test('MWIUrlValidatorService - allows valid URLs', () => {
    const validator = new MWIUrlValidatorService({ baseUrl: 'https://example.com' });
    assertEquals(validator.sanitizeUrl('https://example.com/style.css'), 'https://example.com/style.css');
    assertEquals(validator.sanitizeUrl('/local/style.css'), '/local/style.css');
});

Deno.test('MWIUrlValidatorService - rejects invalid URLs', () => {
    const validator = new MWIUrlValidatorService(); // No base URL
    assertEquals(validator.sanitizeUrl('/local/style.css'), null); // Relative path fails without base
    assertEquals(validator.sanitizeUrl('http://example.com/style.css'), null);
    assertEquals(validator.sanitizeUrl('javascript:alert(1)'), null);
    assertEquals(validator.sanitizeUrl('ftp://example.com'), null);
    assertEquals(validator.sanitizeUrl('data:text/plain,foo'), null);
});