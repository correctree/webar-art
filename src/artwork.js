import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';

export class Artwork {
  constructor() {
    this.root = new THREE.Group();
    this.motion = new THREE.Group(); this.root.add(this.motion);
    this.model = null; this.mixer = null; this.elapsed = 0; this.pulse = 0;
    this.enabled = false; this.turn = 0; this.userScale = 1; this.actionCount = 0;
    this.loader = new GLTFLoader();
    this.draco = new DRACOLoader(); this.draco.setDecoderPath('./vendor/three/draco/');
    this.loader.setDRACOLoader(this.draco); this.ticket = 0;
  }
  async load({kind, url}) {
    const ticket = ++this.ticket;
    let model, animations = [];
    if (kind === 'glb') {
      const gltf = await this.loader.loadAsync(url); model = gltf.scene; animations = gltf.animations;
    } else if (kind === 'image') {
      const texture = await new THREE.TextureLoader().loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      const ratio = texture.image.width / texture.image.height;
      model = new THREE.Group();
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(ratio, 1),
        new THREE.MeshBasicMaterial({map: texture, transparent: true, alphaTest: .03, side: THREE.DoubleSide}));
      plane.position.y = .5; model.add(plane);
    } else { throw new Error('読み込める作品はGLB・PNG・JPEG・WebPです。'); }
    if (ticket !== this.ticket) { disposeObject(model); return false; }
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(longest) || longest <= 0) { disposeObject(model); throw new Error('表示できる形状がありません。'); }
    const center = box.getCenter(new THREE.Vector3());
    const content = new THREE.Group(); content.add(model);
    model.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
    content.scale.setScalar(1 / longest);
    this.clear(); this.model = content; this.motion.add(content);
    if (animations.length) {
      this.mixer = new THREE.AnimationMixer(model);
      for (const clip of animations) this.mixer.clipAction(clip).play();
    }
    this.enabled = false; this.turn = 0; this.pulse = 0; this.elapsed = 0; this.actionCount = 0;
    this.motion.rotation.set(0, 0, 0); this.motion.position.set(0, 0, 0); this.motion.scale.setScalar(1);
    return true;
  }
  react() { this.enabled = !this.enabled; this.pulse = 1; this.actionCount++; }
  update(delta) {
    if (!this.model) return;
    this.elapsed += delta;
    if (this.enabled) { this.turn += delta * .65; this.mixer?.update(delta); }
    this.motion.rotation.y = this.turn;
    this.motion.position.y = this.enabled ? Math.sin(this.elapsed * 2) * .04 : 0;
    this.pulse = Math.max(0, this.pulse - delta * 2.8);
    this.motion.scale.setScalar(1 + Math.sin(this.pulse * Math.PI) * .16);
  }
  clear() {
    if (this.mixer) { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.mixer.getRoot()); this.mixer = null; }
    if (this.model) { this.motion.remove(this.model); disposeObject(this.model); this.model = null; }
  }
  dispose() { this.ticket++; this.clear(); this.draco.dispose(); }
}
export function disposeObject(root) {
  const textures = new Set(); const materials = new Set(); const geometries = new Set();
  root?.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [].concat(object.material || [])) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  textures.forEach(x => x.dispose()); materials.forEach(x => x.dispose()); geometries.forEach(x => x.dispose());
}
