import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, access, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {importTarget} from '../scripts/import-target.mjs';
import {build} from '../scripts/build.mjs';
test('target import rebases CLI image paths for a GitHub Pages subdirectory', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'webar-target-'));
  try {
    await mkdir(resolve(root, 'image-targets'));
    await writeFile(resolve(root, 'image-targets/mk.jpg'), 'image fixture');
    await writeFile(resolve(root, 'image-targets/mk.json'), JSON.stringify({name: 'mk', imagePath: 'image-targets/mk.jpg', type: 'PLANAR', properties: {width: 480}, resources: {}}));
    const data = await importTarget(resolve(root, 'image-targets/mk.json'), root);
    assert.equal(data.imagePath, './target-tracking.jpg'); assert.equal(data.name, 'mk'); assert.equal(data.resources, undefined);
    assert.equal(await readFile(resolve(root, 'public/targets/target-tracking.jpg'), 'utf8'), 'image fixture');
    assert.equal(new URL(data.imagePath, 'https://correctree.github.io/webar-art/public/targets/target.json').pathname, '/webar-art/public/targets/target-tracking.jpg');
  } finally { await rm(root, {recursive: true, force: true}); }
});
test('build includes SDK sidecars, Three addons, decoder, notices, and image assets (fixture dependencies)', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'webar-build-'));
  try {
    const fixture = {
      'node_modules/three/build/three.module.js': 'fixture', 'node_modules/three/examples/jsm/loaders/GLTFLoader.js': 'fixture',
      'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm': 'fixture', 'node_modules/three/LICENSE': 'fixture',
      'node_modules/@8thwall/engine-binary/dist/xr.js': 'fixture', 'node_modules/@8thwall/engine-binary/dist/xr-slam.js': 'fixture',
      'node_modules/@8thwall/engine-binary/LICENSE': 'fixture', 'index.html': 'fixture', 'print.html': 'fixture', 'src/app.js': 'fixture',
      'public/artworks/sample.glb': 'fixture',
    };
    for (const [file, data] of Object.entries(fixture)) { await mkdir(resolve(root, file, '..'), {recursive: true}); await writeFile(resolve(root, file), data); }
    await build(root);
    for (const file of ['external/xr/xr-slam.js', 'vendor/three/examples/jsm/loaders/GLTFLoader.js', 'vendor/three/draco/gltf/draco_decoder.wasm', 'licenses/8thwall-engine.txt', '.nojekyll']) await access(resolve(root, 'dist', file));
    assert.equal(JSON.parse(await readFile(resolve(root, 'dist/build-info.json'))).targetReady, false);
    await writeFile(resolve(root, 'public/targets/target.json'), JSON.stringify({name: 'mk', imagePath: '/bad.jpg', type: 'PLANAR', properties: {}})).catch(async () => {
      await mkdir(resolve(root, 'public/targets')); await writeFile(resolve(root, 'public/targets/target.json'), JSON.stringify({name: 'mk', imagePath: '/bad.jpg', type: 'PLANAR', properties: {}}));
    });
    await assert.rejects(build(root), /相対パス/);
  } finally { await rm(root, {recursive: true, force: true}); }
});
