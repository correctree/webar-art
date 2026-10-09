import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('sample GLB contains embedded geometry and a valid embedded animation timeline', async () => {
  const bytes = await readFile(new URL('../public/artworks/sample.glb', import.meta.url));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67); assert.equal(bytes.readUInt32LE(4), 2); assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonLength = bytes.readUInt32LE(12); const data = JSON.parse(bytes.subarray(20, 20 + jsonLength));
  const binOffset = 20 + jsonLength; const binLength = bytes.readUInt32LE(binOffset);
  assert.equal(bytes.readUInt32LE(binOffset + 4), 0x004e4942);
  assert.equal(data.asset.version, '2.0'); assert.equal(data.buffers[0].uri, undefined);
  for (const view of data.bufferViews) assert.ok(view.byteOffset + view.byteLength <= binLength);
  assert.equal(data.animations[0].channels[0].target.path, 'rotation');
  const timeline = data.bufferViews[data.accessors[data.animations[0].samplers[0].input].bufferView];
  const times = [0, 1, 2].map(i => bytes.readFloatLE(binOffset + 8 + timeline.byteOffset + i * 4));
  assert.deepEqual(times, [0, 2, 4]);
});
