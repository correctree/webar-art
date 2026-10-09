import {surfaceHit, targetMatches} from './policy.js';

// Uses the documented 8th Wall camera pipeline; no synthetic camera or pose fallback.
export class XRAdapter {
  constructor(xr, {canvas, mode, target, name, onScene, onFrame, onStatus, onImage, onError}) {
    Object.assign(this, {xr, canvas, mode, target, name, onScene, onFrame, onStatus, onImage, onError});
    this.running = false; this.stream = null;
  }
  start() {
    if (this.running) throw new Error('ARはすでに起動しています。');
    this.running = true;
    const xr = this.xr;
    const guard = fn => (...args) => { if (this.running) fn?.(...args); };
    try {
      xr.clearCameraPipelineModules();
      xr.XrController.configure({disableWorldTracking: this.mode === 'image',
        imageTargetData: this.mode === 'image' ? [this.target] : [], scale: 'responsive'});
      const image = guard(({detail}) => { if (targetMatches(this.name, detail)) this.onImage?.('pose', detail); });
      xr.addCameraPipelineModules([
        xr.GlTextureRenderer.pipelineModule(), xr.Threejs.pipelineModule(), xr.XrController.pipelineModule(),
        {name: 'webar-art',
          onStart: guard(() => {
            try {
              const context = xr.Threejs.xrScene();
              context.camera.position.set(0, 2, 0);
              xr.XrController.updateCameraProjectionMatrix({origin: context.camera.position, facing: context.camera.quaternion});
              this.onScene(context); this.onStatus?.('started');
            } catch (error) { this.fail(error); }
          }),
          onAttach: guard(({stream}) => { this.stream = stream; }),
          onCameraStatusChange: guard(({status}) => {
            if (status === 'failed') this.fail(new Error('カメラを開始できません。Safariのカメラ許可とHTTPSを確認してください。'));
          }),
          onException: guard(error => this.fail(error)),
          onUpdate: guard(({processCpuResult}) => {
            const reality = processCpuResult?.reality;
            if (this.mode === 'world' && reality?.trackingStatus) this.onStatus?.(reality.trackingStatus);
            this.onFrame?.();
          }),
          listeners: [
            {event: 'reality.imagefound', process: image},
            {event: 'reality.imageupdated', process: image},
            {event: 'reality.imagelost', process: guard(({detail}) => {
              if (targetMatches(this.name, detail)) this.onImage?.('lost', detail);
            })},
            {event: 'reality.imagescanning', process: guard(() => this.onStatus?.('scanning'))},
          ]},
      ]);
      xr.run({canvas: this.canvas, allowedDevices: xr.XrConfig.device().ANY,
        cameraConfig: {direction: xr.XrConfig.camera().BACK}});
    } catch (error) { this.fail(error); }
  }
  hitTest(x, y) { return this.running ? surfaceHit(this.xr.XrController.hitTest(x, y)) : null; }
  fail(error) {
    try { this.stop(); } finally { this.onError?.(error instanceof Error ? error : new Error(String(error))); }
  }
  stop() {
    if (!this.running) return;
    this.running = false;
    try { this.xr.stop(); } finally {
      this.stream?.getTracks?.().forEach(track => track.stop()); this.stream = null;
      this.xr.clearCameraPipelineModules();
    }
  }
}
