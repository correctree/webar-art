import {test} from 'node:test';import assert from 'node:assert/strict';import {TrackingState,errorMessage} from '../src/state.js';
test('acquisition / loss / reacquisition',()=>{const s=new TrackingState();assert.equal(s.event('found'),'tracking');assert.equal(s.event('lost'),'lost');assert.equal(s.event('found'),'reacquired');assert.equal(s.found,2);assert.equal(s.lost,1);});
test('permission errors give actionable text',()=>assert.match(errorMessage({name:'NotAllowedError'}),/許可/));
