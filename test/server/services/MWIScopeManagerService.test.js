import {
    assertEquals,
    assertNotEquals
} from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { MWIScopeManagerService } from 'mesgjs-web/src/server/services/MWIScopeManagerService.esm.js';

Deno.test('MWIScopeManagerService - generates unique IDs', () => {
    const sms = new MWIScopeManagerService();
    const id1 = sms.getScopeId('componentA');
    const id2 = sms.getScopeId('componentB');
    const id3 = sms.getScopeId('componentA');

    assertEquals(id1, id3);
    assertNotEquals(id1, id2);
});

Deno.test('MWIScopeManagerService - rehydration', () => {
    const initialState = {
        scopeIds: [
            ['componentA', 'mwi-0']
        ],
        nextId: 1
    };

    const sms = new MWIScopeManagerService(initialState);
    const id1 = sms.getScopeId('componentA');
    const id2 = sms.getScopeId('componentB');

    assertEquals(id1, 'mwi-0');
    assertEquals(id2, 'mwi-1');
});

Deno.test('MWIScopeManagerService - getState', () => {
    const sms = new MWIScopeManagerService();
    sms.getScopeId('componentA');
    sms.getScopeId('componentB');

    const state = sms.getState();

    assertEquals(state.nextId, 2);
    assertEquals(state.scopeIds.length, 2);
    assertEquals(state.scopeIds[0][0], 'componentA');
});