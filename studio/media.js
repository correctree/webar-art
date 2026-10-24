import {applyDisplayPolicy} from './display-policy.js';
import {materialPlayback,materialControlled,materialStartsManually} from './material-playback.js';
import {staticImageMaterialOptions} from './static-image.js';
import {sceneMaskSources} from './box-mask-policy.js';
import {createBoxMask,updateBoxMask,applyBoxMask,boxMaskAllows} from './box-mask.js';
import {ActionSequence,startsWithAppearance,startsHidden} from './action-sequence.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {patchPackedAlphaDepth} from './shadow-rig.js';
import {spriteFrame,spriteSpec} from './schema.js';
export class MediaScene {
  constructor(resolveURL, baseURL = new URL('../', import.meta.url)) {
    this.resolveURL=resolveURL; this.root=new THREE.Group();this.items=new Map();this.time=0;this.playing=true;
    this.loader=new GLTFLoader();this.draco=new DRACOLoader();
    this.draco.setDecoderPath(new URL('vendor/three/draco/',baseURL).href);this.loader.setDRACOLoader(this.draco);
  }
  async add(spec) {
    const group=new THREE.Group(); let mesh,mixer,video,texture,clips=[];
    const motion=new THREE.Group();group.add(motion);
    try {
      if(spec.kind==='glb') {
        const data=await this.loader.loadAsync(this.resolveURL(spec.src));
        const box=new THREE.Box3().setFromObject(data.scene);const size=box.getSize(new THREE.Vector3());const longest=Math.max(size.x,size.y,size.z);
        if(!Number.isFinite(longest)||longest<=0)throw new Error('GLBに形状がありません。');
        const center=box.getCenter(new THREE.Vector3());data.scene.position.sub(center);data.scene.scale.setScalar(1/longest);
        // Translation must also be normalized after scaling the original model.
        data.scene.position.divideScalar(longest);motion.add(data.scene);
        if(data.animations.length){mixer=new THREE.AnimationMixer(data.scene);clips=data.animations;}
      } else {
        let ratio=1,material;
        if(spec.kind==='image') {
          texture=await new THREE.TextureLoader().loadAsync(this.resolveURL(spec.src));ratio=texture.image.width/texture.image.height;texture.colorSpace=THREE.SRGBColorSpace;
          material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,...staticImageMaterialOptions(spec.src)});
        } else if(spec.kind==='sprite') {
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
            material=new THREE.ShaderMaterial({uniforms:{map:{value:texture},artOpacity:{value:1},packedTexel:{value:new THREE.Vector2(1/video.videoWidth,1/video.videoHeight)}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
              vertexShader:'#include <clipping_planes_pars_vertex>\nvarying vec2 vUv; void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;\n#include <clipping_planes_vertex>\n}',
              fragmentShader:'#include <clipping_planes_pars_fragment>\nuniform sampler2D map;uniform float artOpacity;uniform vec2 packedTexel;varying vec2 vUv;void main(){\n#include <clipping_planes_fragment>\nvec2 colorUv=clamp(vec2(vUv.x*0.5,vUv.y),packedTexel*0.5,vec2(0.5,1.0)-packedTexel*0.5);vec2 alphaUv=clamp(vec2(0.5+vUv.x*0.5,vUv.y),vec2(0.5,0.0)+packedTexel*0.5,vec2(1.0)-packedTexel*0.5);vec3 c=texture2D(map,colorUv).rgb;float a=texture2D(map,alphaUv).r;if(a<0.015)discard;gl_FragColor=vec4(c,a*artOpacity);}' });
          }else {texture.colorSpace=THREE.SRGBColorSpace;material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});}
        }
        // WebGLShadowMap copies the visible material map/alphaTest into custom depth materials.
        if(spec.kind==='video'&&spec.fallback.packedAlpha){material.map=texture;material.alphaTest=.015;}
        mesh=new THREE.Mesh(new THREE.PlaneGeometry(ratio,1),material);mesh.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:texture,alphaTest:.015,side:THREE.DoubleSide});if(spec.kind==='video'&&spec.fallback.packedAlpha){mesh.customDepthMaterial.onBeforeCompile=shader=>patchPackedAlphaDepth(shader,texture);mesh.customDepthMaterial.customProgramCacheKey=()=>'webar-packed-alpha-depth-texel-clamp-1';}motion.add(mesh);
      }
      motion.traverse(node=>{if(!node.isMesh)return;if(!node.customDepthMaterial)node.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});});
      const item={maskTime:0,mask:createBoxMask(),spec,group,motion,mixer,clips,video,texture,time:0,playing:spec.autoplay!==false,gate:true,effectTime:null};group.userData.objectId=spec.id;this.items.set(spec.id,item);this.root.add(group);this.apply(spec);this.configure(item);this.update(0);return item;
    }catch(error){video?.pause();video?.removeAttribute('src');dispose(group);texture?.dispose();throw error;}
  }
  apply(spec){const item=this.items.get(spec.id);if(!item)return;item.spec=spec;item.group.position.fromArray(spec.position);item.group.rotation.set(...spec.rotation.map(v=>THREE.MathUtils.degToRad(v)));item.group.scale.fromArray(spec.scale);this.updateItemMask(item);item.motion.traverse(o=>{if(o.isMesh)o.castShadow=spec.shadow===true;if(o.customDepthMaterial)o.customDepthMaterial.opacity=(spec.opacity??1)*(item.fade??1);for(const m of [].concat(o.material||[])){m.userData.artBase??={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite};const opacity=(spec.opacity??1)*(item.fade??1);if(m.uniforms?.artOpacity)m.uniforms.artOpacity.value=opacity;else m.opacity=m.userData.artBase.opacity*opacity;m.transparent=m.userData.artBase.transparent||opacity<1;m.depthWrite=opacity<1?false:m.userData.artBase.depthWrite;m.needsUpdate=true;}});applyDisplayPolicy(item,THREE.DoubleSide);}
  updateItemMask(item){const source=this.items.get(this.maskSources?.get(item.spec.id))||item;if(this.maskCamera&&item.mask.uniforms?.artMaskEye)this.maskCamera.getWorldPosition(item.mask.uniforms.artMaskEye.value);updateBoxMask(item.mask,source.spec,source.group.parent,source.maskTime||0);applyBoxMask(item.motion,item.mask);}
  updateMasks(project,camera){if(project)this.maskSources=sceneMaskSources(project);if(camera)this.maskCamera=camera;for(const item of this.items.values())if(item.spec.boxMask?.enabled||item.mask.enabled||this.maskSources?.has(item.spec.id))this.updateItemMask(item);}
  maskReceiver(receiver,objectId){
    const source=this.items.get(this.maskSources?.get(objectId));if(!source&&!receiver.userData.portalMaskState)return;
    const state=receiver.userData.portalMaskState??=createBoxMask();
    if(this.maskCamera)this.maskCamera.getWorldPosition(state.uniforms.artMaskEye.value);
    updateBoxMask(state,source?.spec||{},source?.group.parent||receiver.parent,source?.maskTime||0);applyBoxMask(receiver,state);
  }
  hitPriority(hit){let node=hit.object;while(node&&!node.userData.objectId)node=node.parent;return this.items.get(node?.userData.objectId)?.spec.displayMode==='front'?1:0;}
  hitVisible(hit){let node=hit.object;while(node&&!node.userData.objectId)node=node.parent;const item=this.items.get(node?.userData.objectId);return !!item&&item.spec.visible!==false&&boxMaskAllows(item.mask,hit.point);}
  configure(item, interaction=item.spec.interaction){if(item.video)item.video.loop=interaction?.loop??(item.spec.loop!==false);if(!item.mixer)return;item.mixer.stopAllAction();const name=interaction?.clip||'all';if(name!=='all'&&!item.clips.some(c=>c.name===name))throw new Error('GLBアニメーションがありません: '+name);for(const clip of item.clips){if(name!=='all'&&clip.name!==name)continue;const action=item.mixer.clipAction(clip);action.reset();action.setLoop(interaction?.loop===false?THREE.LoopOnce:THREE.LoopRepeat,interaction?.loop===false?1:Infinity);action.clampWhenFinished=true;action.play();}}
  restart(id){const i=this.items.get(id);if(!i||materialControlled(i.spec))return Promise.resolve();i.time=0;if(i.video)i.video.currentTime=0;this.configure(i);i.playing=true;return this.sync(i);}
  setPlaying(id,playing){const i=this.items.get(id);if(!i||materialControlled(i.spec))return Promise.resolve();i.playing=playing;return this.sync(i);}
  setGate(id,gate){const i=this.items.get(id);if(!i)return;i.gate=gate;this.sync(i).catch(e=>this.onPlaybackError?.(e));}
  sync(i){const run=this.playing&&i.playing&&i.gate&&!i.paused;if(i.video){if(run)return i.video.play();i.video.pause();}return Promise.resolve();}
  allowTap(o){const r=this.items.get(o.id)?.runner;return r?.waitingFor==='tap'||!(o.interaction.sequence?.enabled&&r?.active&&o.interaction.sequence.retrigger==='ignore');}
  effect(id,kind='tap'){const i=this.items.get(id);if(!i)return;const q=i.spec.interaction.sequence;if(q?.enabled){i.effectTime=null;if(!i.runner)i.runner=new ActionSequence(q,a=>['mediaPlay','mediaPause'].includes(a.type)?this.runMaterialAction(i,a):this.onAction?.(i.spec,a),{visible:!startsHidden(i.spec),groupTriggers:true,firstTrigger:i.spec.interaction.startTrigger||'tap'});i.runner.signal(kind);}else{i.runner=null;i.effectTime=0;}}

  runMaterialAction(item,action){try{return materialPlayback(item,action,{configure:(i,b)=>this.configure(i,b),sync:i=>this.sync(i),onError:e=>this.onPlaybackError?.(e)});}catch(e){this.onPlaybackError?.(e);return{failed:true,done:false};}}
  reset(id){const i=this.items.get(id);if(!i)return;i.time=0;i.maskTime=0;i.mediaLoop=undefined;i.effectTime=null;i.runner=null;i.motion.visible=!startsHidden(i.spec);i.paused=false;this.setFade(i,i.motion.visible?1:0);i.followCamera=false;i.motion.position.set(0,0,0);i.motion.rotation.set(0,0,0);i.motion.scale.setScalar(1);if(i.video){i.video.pause();i.video.currentTime=0;i.video.loop=i.spec.interaction?.loop??true;}this.configure(i);i.playing=!materialStartsManually(i.spec)&&i.spec.autoplay!==false;}
  primeVideos(){return Promise.allSettled([...this.items.values()].filter(i=>i.video).map(i=>i.video.play().then(()=>{if(!this.playing||!i.playing||!i.gate||i.paused)i.video.pause();})));}
  play(){this.playing=true;return Promise.allSettled([...this.items.values()].map(i=>this.sync(i)));}
  pause(){this.playing=false;for(const i of this.items.values())i.video?.pause();}
  faceCamera(camera){if(!camera)return;camera.updateMatrixWorld(true);const target=new THREE.Vector3(),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));camera.getWorldPosition(target);for(const i of this.items.values())if(i.followCamera&&!i.paused&&i.gate&&i.group.visible){i.motion.updateWorldMatrix(true,false);const localTarget=i.group.worldToLocal(target.clone());if(localTarget.distanceToSquared(i.motion.position)<1e-10)continue;const localUp=up.clone().transformDirection(new THREE.Matrix4().copy(i.group.matrixWorld).invert());i.motion.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(localTarget,i.motion.position,localUp));i.motion.updateMatrixWorld(true);}}

  setFade(i,value){if(i.fade===value)return;i.fade=value;i.motion.traverse?.(o=>{if(o.customDepthMaterial)o.customDepthMaterial.opacity=(i.spec.opacity??1)*value;for(const m of [].concat(o.material||[])){m.userData.artBase??={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite};const opacity=(i.spec.opacity??1)*value;if(m.uniforms?.artOpacity)m.uniforms.artOpacity.value=opacity;else m.opacity=m.userData.artBase.opacity*opacity;m.transparent=m.userData.artBase.transparent||opacity<1;m.depthWrite=opacity<1?false:m.userData.artBase.depthWrite;m.needsUpdate=true;}});applyDisplayPolicy(i,THREE.DoubleSide);}
  update(delta){if(this.playing)this.time+=delta;for(const i of this.items.values()){if(this.playing&&i.gate&&this.maskAnimationEnabled!==false)i.maskTime=(i.maskTime||0)+delta;let mediaDelta=delta;const wasPaused=!!i.paused;
   if(i.runner&&this.playing&&i.gate){const runner=i.runner,p=runner.update(delta);if(i.runner!==runner)continue;mediaDelta=Math.max(0,delta-(runner.pausedDelta||0));i.motion.position.fromArray(p.position);if(!(p.paused&&i.followCamera))i.motion.rotation.set(...p.rotation);i.motion.scale.fromArray(p.scale);i.motion.visible=p.visible;i.followCamera=p.followCamera;i.paused=p.paused;this.setFade(i,p.alpha);}
   else if(i.paused)mediaDelta=0;
   if(wasPaused!==!!i.paused)this.sync(i).catch(e=>this.onPlaybackError?.(e));
   const run=this.playing&&i.playing&&i.gate;if(run){i.time+=mediaDelta;i.mixer?.update(mediaDelta);}if(i.spec.kind==='sprite'){let time=i.time;const s=i.spec.sprite;if((i.mediaLoop??i.spec.interaction?.loop)===false)time=Math.min(time,(s.frames-1)/s.fps);const f=spriteFrame(time,{...s,loop:i.mediaLoop??i.spec.interaction?.loop??s.loop});i.texture.offset.set(f.x,f.y);}
   if(i.effectTime!==null&&this.playing&&i.gate){i.effectTime+=delta;const spec=i.spec.interaction,d=spec.duration,t=Math.min(1,i.effectTime/d),wave=Math.sin(Math.PI*t);i.motion.position.set(0,0,spec.effect==='bounce'?wave*.25:0);i.motion.rotation.z=spec.effect==='rotate'?t*Math.PI*2:0;i.motion.scale.setScalar(spec.effect==='pulse'?1+wave*.3:1);if(t===1){i.effectTime=null;i.motion.position.set(0,0,0);i.motion.rotation.set(0,0,0);i.motion.scale.setScalar(1);}}
  }}
  remove(id){const item=this.items.get(id);if(!item)return;item.video?.pause();if(item.video){item.video.removeAttribute('src');item.video.load();}item.mixer?.stopAllAction();item.group.removeFromParent();dispose(item.group);item.texture?.dispose();this.items.delete(id);}
  dispose(){for(const id of [...this.items.keys()])this.remove(id);this.draco.dispose();}
}
function dispose(root){const ts=new Set();root.traverse(o=>{o.geometry?.dispose();o.customDepthMaterial?.dispose();for(const m of [].concat(o.material||[])){for(const t of Object.values(m))if(t?.isTexture)ts.add(t);m.dispose();}});for(const t of ts)t.dispose();}
