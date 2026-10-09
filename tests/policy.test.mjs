import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasPoint, surfaceHit, validTarget, validAssetName, targetMatches} from '../src/policy.js';
test('canvas coordinates account for offsets and reject UI outside the view', () => {
  const rect = {left: 30, top: 60, width: 300, height: 600};
  assert.deepEqual(canvasPoint(180, 360, rect), {x: .5, y: .5});
  assert.equal(canvasPoint(0, 360, rect), null);
  assert.equal(canvasPoint(40, 70, {...rect, width: 0}), null);
});
test('placement requires a real estimated or detected surface; feature points never substitute', () => {
  const p = {x: 1, y: 0, z: -2};
  assert.equal(surfaceHit([{type: 'FEATURE_POINT', position: p}]), null);
  assert.equal(surfaceHit([]), null);
  assert.equal(surfaceHit([{type: 'DETECTED_SURFACE', position: {x: NaN, y: 0, z: 0}}]), null);
  const detected = {type: 'DETECTED_SURFACE', position: p};
  assert.equal(surfaceHit([{type: 'ESTIMATED_SURFACE', position: p}, detected]), detected);
});
test('MindAR target and unsupported assets are not accepted as 8th Wall targets or artwork', () => {
  assert.equal(!!validTarget({imagePath: 'test.mind'}), false);
  assert.equal(!!validTarget({imagePath: './luminance.jpg', type: 'PLANAR', properties: {}}), true);
  assert.equal(validAssetName('my art.GLB'), true); assert.equal(validAssetName('a.png'), true);
  assert.equal(validAssetName('../a.glb'), false); assert.equal(validAssetName('a.gltf'), false);
  assert.equal(targetMatches('mk_1008', {name: 'other'}), false);
});
