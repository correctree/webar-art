import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {spriteFrame,spriteSpec} from './schema.js';
export class MediaScene {
  constructor(resolveURL, baseURL = new URL('../', import.meta.url)) {
    this.resolveURL=resolveURL; this.root=new THREE.Group();this.items=new Map();this.time=0;this.playing=true;
    this.loader=new GLTFLoader();this.draco=new DRACOLoader();
    this.draco.setDecoderPath(new URL('vendor/three/draco/',baseURL).href);this.loader.setDRACOLoader(this.draco);
  }
  async add(spec) {
    const group=new THREE.Group(); let mesh,mixer,video,texture;
    try {
      if(spec.kind==='glb') {
        const data=await this.loader.loadAsync(this.resolveURL(spec.src));
        const box=new THREE.Box3().setFromObject(data.scene);const size=box.getSize(new THREE.Vector3());const longest=Math.max(size.x,size.y,size.z);
        if(!Number.isFinite(longest)||longest<=0)throw new Error('GLBに形状がありません。');
        const center=box.getCenter(new THREE.Vector3());data.scene.position.sub(center);data.scene.scale.setScalar(1/longest);
        // Translation must also be normalized after scaling the original model.
        data.scene.position.divideScalar(longest);group.add(data.scene);
        if(data.animations.length){mixer=new THREE.AnimationMixer(data.scene);data.animations.forEach(clip=>mixer.clipAction(clip).play());}
      } else {
        let ratio=1,material;
        if(spec.kind==='sprite') {
          const s=spriteSpec(spec.sprite);texture=await new THREE.TextureLoader().loadAsync(this.resolveURL(spec.src));
          if(texture.image.width!==s.frameWidth*s.columns||texture.image.height!==s.frameHeight*s.rows)throw new Error('Spriteシート寸法とJSONが一致しません。');
          texture.repeat.set(1/s.columns,1/s.rows);ratio=s.frameWidth/s.frameHeight;
          texture.colorSpace=THREE.SRGBColorSpace;
          material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.015,side:THREE.DoubleSide,depthWrite:false});
        } else {
          video=document.createElement('video');video.muted=true;video.loop=spec.loop!==false;video.playsInline=true;video.preload='auto';video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
          video.crossOrigin='anonymous';video.src=this.resolveURL(spec.fallback.src);
          await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('動画読込タイムアウト')),30000);video.onloadedmetadata=()=>{clearTimeout(t);resolve();};video.onerror=()=>{clearTimeout(t);reject(new Error('動画を読み込めません。'));};video.load();});
          texture=new THREE.VideoTexture(video);ratio=video.videoWidth/(spec.fallback.packedAlpha?2:1)/video.videoHeight;
          if(spec.fallback.packedAlpha) {
            material=new THREE.ShaderMaterial({uniforms:{map:{value:texture}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
              vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
              fragmentShader:'uniform sampler2D map;varying vec2 vUv;void main(){vec3 c=texture2D(map,vec2(vUv.x*0.5,vUv.y)).rgb;float a=texture2D(map,vec2(0.5+vUv.x*0.5,vUv.y)).r;if(a<0.015)discard;gl_FragColor=vec4(c,a);}' });
          }else {texture.colorSpace=THREE.SRGBColorSpace;material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});}
        }
        mesh=new THREE.Mesh(new THREE.PlaneGeometry(ratio,1),material);group.add(mesh);
      }
      const item={spec,group,mixer,video,texture};this.items.set(spec.id,item);this.root.add(group);this.apply(spec);this.update(0);return item;
    }catch(error){video?.pause();video?.removeAttribute('src');dispose(group);texture?.dispose();throw error;}
  }
  apply(spec){const item=this.items.get(spec.id);if(!item)return;item.spec=spec;item.group.position.fromArray(spec.position);item.group.rotation.set(...spec.rotation.map(v=>THREE.MathUtils.degToRad(v)));item.group.scale.fromArray(spec.scale);}
  play(){this.playing=true;return Promise.allSettled([...this.items.values()].filter(i=>i.video).map(i=>i.video.play()));}
  pause(){this.playing=false;for(const i of this.items.values())i.video?.pause();}
  update(delta){if(this.playing)this.time+=delta;for(const item of this.items.values()){if(this.playing)item.mixer?.update(delta);if(item.spec.kind==='sprite'){const f=spriteFrame(this.time,item.spec.sprite);item.texture.offset.set(f.x,f.y);}}}
  remove(id){const item=this.items.get(id);if(!item)return;item.video?.pause();if(item.video){item.video.removeAttribute('src');item.video.load();}item.mixer?.stopAllAction();this.root.remove(item.group);dispose(item.group);item.texture?.dispose();this.items.delete(id);}
  dispose(){for(const id of [...this.items.keys()])this.remove(id);this.draco.dispose();}
}
function dispose(root){const ts=new Set();root.traverse(o=>{o.geometry?.dispose();for(const m of [].concat(o.material||[])){for(const t of Object.values(m))if(t?.isTexture)ts.add(t);m.dispose();}});for(const t of ts)t.dispose();}
