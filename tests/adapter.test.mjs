import test from 'node:test';
import assert from 'node:assert/strict';
import {XRAdapter} from '../src/xr-adapter.js';
function setup(mode = 'world') {
  const log = []; let modules = []; let stops = 0;
  const xr = {
    clearCameraPipelineModules() { log.push('clear'); }, stop() { log.push('stop'); },
    addCameraPipelineModules(value) { modules = value; },
    GlTextureRenderer: {pipelineModule: () => ({name: 'feed'})},
    Threejs: {pipelineModule: () => ({name: 'three'}), xrScene: () => ({camera: {position: {set() {}}, quaternion: {}}})},
    XrController: {configure(value) { log.push(value); }, pipelineModule: () => ({name: 'controller'}),
      updateCameraProjectionMatrix() {}, hitTest: () => []},
    XrConfig: {device: () => ({ANY: 'any'}), camera: () => ({BACK: 'back'})},
    run(options) { log.push(options); },
  };
  const events = [];
  const adapter = new XRAdapter(xr, {canvas: {}, mode, name: 'mk_1008', target: {name: 'mk_1008'},
    onScene: () => events.push('scene'), onImage: event => events.push(event), onError: error => events.push(error.message)});
  const stream = {getTracks: () => [{stop() { stops++; }}]};
  return {adapter, log, events, xr, stream, module: () => modules.at(-1), stops: () => stops};
}
test('image mode registers only its target and ignores events for other images', () => {
  const s = setup('image'); s.adapter.start();
  assert.equal(s.log[1].disableWorldTracking, true); assert.equal(s.log[1].imageTargetData.length, 1);
  const module = s.module(); module.onStart();
  const found = module.listeners.find(x => x.event === 'reality.imagefound').process;
  found({detail: {name: 'other'}}); found({detail: {name: 'mk_1008'}});
  module.listeners.find(x => x.event === 'reality.imagelost').process({detail: {name: 'mk_1008'}});
  assert.deepEqual(s.events, ['scene', 'pose', 'lost']);
  s.adapter.stop(); found({detail: {name: 'mk_1008'}});
  assert.deepEqual(s.events, ['scene', 'pose', 'lost']);
});
test('world mode uses SLAM, rejects duplicate starts, releases the camera, and can restart', () => {
  const s = setup(); s.adapter.start();
  assert.equal(s.log[1].disableWorldTracking, false); assert.deepEqual(s.log[1].imageTargetData, []);
  assert.throws(() => s.adapter.start());
  s.module().onAttach({stream: s.stream});
  assert.equal(s.adapter.hitTest(.5, .5), null);
  s.adapter.stop(); s.adapter.stop(); assert.equal(s.stops(), 1);
  assert.equal(s.log.filter(x => x === 'stop').length, 1);
  s.adapter.start(); assert.equal(s.adapter.running, true); s.adapter.stop();
});
test('permission failure and scene startup exceptions stop the engine', () => {
  for (const sceneFailure of [false, true]) {
    const s = setup(); if (sceneFailure) s.adapter.onScene = () => { throw new Error('scene failed'); };
    s.adapter.start(); s.module().onAttach({stream: s.stream});
    if (sceneFailure) s.module().onStart(); else s.module().onCameraStatusChange({status: 'failed'});
    assert.equal(s.adapter.running, false); assert.equal(s.stops(), 1); assert.equal(s.events.length, 1);
  }
});
