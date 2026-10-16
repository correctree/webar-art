import * as THREE from 'three';
import {loadEngine} from '../src/engine-loader.js';
import {XRAdapter} from '../src/xr-adapter.js';
import {placementCheck,SPACE_SCALE,aimLayout,stablePlacement,projectedCandidateCheck,pairDistances,pairDrift} from './space-policy.js';

// Keeps the existing media/behavior player on the same scene graph. The engine
// owns the camera and renderer; artwork transforms are never rewritten per frame.
export class SpaceRuntime {
 constructor({container,scale=SPACE_SCALE,onPlacement,onTracking,onError,onStatus}){
  Object.assign(this,{container,onPlacement,onTracking,onError,onStatus});this.scale=scale;this.baseScale=scale;this.displayMultiplier=1;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera();
  this.anchor=new THREE.Group();this.contentRoot=new THREE.Group();
  this.contentRoot.rotation.x=-Math.PI/2;this.anchor.scale.setScalar(scale);
  this.anchor.add(this.contentRoot);this.scene.add(this.anchor);this.anchor.visible=false;
  this.canvas=document.createElement('canvas');this.canvas.className='space-camera';this.canvas.style.cssText='position:absolute;left:0;top:0;width:100%!important;height:100%!important;display:block';container.append(this.canvas);
  this.resize=()=>{if(this.running)return;this.canvas.width=Math.round(container.clientWidth);this.canvas.height=Math.round(container.clientHeight);};
  this.resize();window.addEventListener('resize',this.resize);
  this.renderer={domElement:this.canvas,shadowMap:{enabled:false,type:THREE.PCFShadowMap},setAnimationLoop:fn=>{this.loop=fn;},render:()=>{}};
  this.aimElement=document.getElementById?.('space-aim');this.aimLabel=document.getElementById?.('space-aim-label');this.samples=[];this.events=[];this.tracking='LIMITED';this.placed=false;this.running=false;this.generation=0;
 }
 addAnchor(){return {group:new THREE.Group()};}
 async prepare(){window.THREE=THREE;this.engine=await loadEngine();await this.engine.loadChunk('slam');}
 relative(position){this.camera.updateWorldMatrix(true,false);return position.clone().sub(this.camera.getWorldPosition(new THREE.Vector3())).applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion()).invert());}
 check(position){
  const gate=placementCheck(this.relative(position).toArray());if(!gate.accepted)return gate;
  const projected=position.clone().project(this.camera);
  return projectedCandidateCheck(projected,this.aim||{x:.5,y:.5})?{...gate,projected:projected.toArray()}:{...gate,accepted:false,reason:'OUTSIDE_AIM',projected:projected.toArray()};
 }
 updateAim(ready=false,progress=0){
  const rect=this.canvas.getBoundingClientRect(),panel=document.getElementById('ar-controls'),toggle=document.getElementById('ar-ui-toggle');
  const v=window.visualViewport,viewport={left:v?.offsetLeft||0,top:v?.offsetTop||0,width:v?.width||window.innerWidth,height:v?.height||window.innerHeight};
  const layout=aimLayout(this.container.getBoundingClientRect(),rect,viewport,panel&&!panel.hidden?panel.getBoundingClientRect().top:Infinity,toggle?.getBoundingClientRect().bottom||0);
  this.aim=layout.aim;this.viewportDiagnostic={viewport,stage:this.container.getBoundingClientRect().toJSON?.()||layout.visible,canvas:{left:rect.left,top:rect.top,width:rect.width,height:rect.height},screen:layout.screen,aim:this.aim};
  if(this.aimElement){this.aimElement.hidden=!this.running||this.placed;this.aimElement.style.left=layout.screen.x+'px';this.aimElement.style.top=layout.screen.y+'px';this.aimElement.classList.toggle('ready',ready);}
  const percent=ready?100:Math.min(99,Math.floor(progress*100));
  if(this.aimLabel)this.aimLabel.textContent=ready?'配置できます':progress>0?'安定確認中 '+percent+'% — 少し静止してください':'配置場所を探しています';
  const bar=document.getElementById('space-aim-progress'),button=document.getElementById('space-aim-place');
  if(bar)bar.value=percent;
  if(button){button.disabled=!ready;button.textContent=ready?'ここに配置':'安定を待っています';}
 }
 record(type,value){this.events.push({time:new Date().toISOString(),type,value});if(this.events.length>150)this.events.shift();}
 async start(){
  if(this.running)return;this.running=true;this.placed=false;this.anchor.visible=false;this.tracking='LIMITED';this.clearCandidate();this.baselinePairs=null;
  const generation=++this.generation;this.record('start',{});
  await new Promise((resolve,reject)=>{
   this.pendingReject=reject;
   const fail=e=>{if(generation!==this.generation)return;this.pendingReject=null;reject(e);this.onError?.(e);};
   const guarded={...this.engine,run:options=>{const result=this.engine.run(options);result?.catch?.(fail);return result;}};
   this.adapter=new XRAdapter(guarded,{canvas:this.canvas,mode:'world',onScene:context=>{
    if(generation!==this.generation)return;
    this.actualRenderer=context.renderer;this.camera=context.camera;this.actualScene=context.scene;this.actualScene.add(this.scene);
    context.renderer.localClippingEnabled=true;context.renderer.shadowMap.enabled=this.renderer.shadowMap.enabled;context.renderer.shadowMap.type=this.renderer.shadowMap.type;
    this.reticle?.geometry.dispose();this.reticle?.material.dispose();this.reticle?.removeFromParent();
    this.reticle=new THREE.Mesh(new THREE.RingGeometry(.075,.095,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffcd72,side:THREE.DoubleSide,depthTest:false}));
    this.reticle.visible=false;this.reticle.renderOrder=10;this.actualScene.add(this.reticle);this.pendingReject=null;resolve();
   },onStatus:status=>{if(!['NORMAL','LIMITED'].includes(status))return;if(this.tracking!==status){this.tracking=status;this.record('tracking',status);if(this.placed)this.onTracking?.(status);}},onFrame:()=>{try{this.frame();}catch(e){fail(e);}},onError:fail});this.adapter.start();
  });
 }
 clearCandidate(){this.candidate=null;this.steadyAnchor=null;this.candidateType=null;this.candidateAt=0;if(this.reticle)this.reticle.visible=false;this.steadyMean=null;this.steadyCount=0;this.stability=null;}
 frame(){
  if(!this.running)return;const now=performance.now();this.updateAim(false);
  if(!this.placed){
   if(this.tracking!=='NORMAL'){this.clearCandidate();this.onStatus?.('床や机をゆっくり映して、周囲の認識を待ってください。',false);}
   else {
    const rank={DETECTED_SURFACE:0,ESTIMATED_SURFACE:1,FEATURE_POINT:2};
    const hits=this.engine.XrController.hitTest(this.aim.x,this.aim.y)||[];
    const checks=hits.filter(h=>h?.position&&Object.hasOwn(rank,h.type)).map(h=>{const p=new THREE.Vector3(h.position.x,h.position.y,h.position.z);return {h,p,...this.check(p)};});
    const hit=checks.filter(c=>c.accepted).sort((a,b)=>rank[a.h.type]-rank[b.h.type]||a.distance-b.distance)[0];
    if(now-(this.lastCheck||0)>1500){this.lastCheck=now;this.record('candidates',checks.map(c=>({type:c.h.type,position:c.p.toArray(),reason:c.reason})));}
    if(!hit){this.clearCandidate();this.onStatus?.('前方の配置候補を探しています。模様のある床や机へ向けてください。',false);}
    else {
     const cluster=stablePlacement(this.stability,hit.p.toArray(),hit.h.type,now);this.stability=cluster.state;
     this.steadyMean=new THREE.Vector3(...cluster.mean);this.candidateType=hit.h.type;this.reticle.visible=false;
     const ready=cluster.ready&&this.check(this.steadyMean).accepted;this.candidate=ready?this.steadyMean.clone():null;this.updateAim(ready,Math.max(.01,Math.min(1,(now-cluster.state.since)/1500)));this.candidateAt=now;

     this.reticle.material.color.set(ready?0xa4efc9:0xffcd72);
     this.onStatus?.(ready?'特徴点の目印に作品群を配置できます（平面未確認）。':'目印を安定させています。カメラを少し止めてください。',ready);
    }
   }
  }else if(now-(this.lastSample||0)>=500){this.lastSample=now;this.capture('interval');}
  this.loop?.();
 }
 place(){
  if(!this.running||this.placed||this.tracking!=='NORMAL'||!this.candidate)return false;
  const gate=this.check(this.candidate);
  if(!gate.accepted||performance.now()-this.candidateAt>250){this.record('rejected',gate);this.clearCandidate();return false;}
  this.anchor.position.copy(this.candidate);this.anchor.visible=true;this.placed=true;
  this.record('placed',{position:this.anchor.position.toArray(),scale:this.scale,type:this.candidateType});this.clearCandidate();this.onPlacement?.(true);if(this.aimElement)this.aimElement.hidden=true;this.capture('placed');return true;
 }
 setDisplayMultiplier(value){
  if(!Number.isFinite(value)||value<.25||value>8)return false;
  this.displayMultiplier=value;this.scale=this.baseScale*value;this.anchor.scale.setScalar(this.scale);
  this.baselinePairs=null;this.record('display-scale',{multiplier:value,scale:this.scale});return true;
 }
 reset(){this.placed=false;this.anchor.visible=false;this.clearCandidate();this.baselinePairs=null;this.record('reset',{});this.onPlacement?.(false);}
 capture(reason){
  if(!this.placed)return;this.scene.updateWorldMatrix(true,true);const objects=this.inspectObjects?.()||[],pairs=pairDistances(objects);if(!this.baselinePairs)this.baselinePairs=pairs;const drift=pairDrift(this.baselinePairs,pairs);const camera=this.camera.getWorldPosition(new THREE.Vector3()),anchor=this.anchor.getWorldPosition(new THREE.Vector3());
  this.samples.push({time:new Date().toISOString(),reason,tracking:this.tracking,objects,pairDistances:pairs,maxPairDistanceChange:drift,cameraPosition:camera.toArray(),anchorPosition:anchor.toArray(),distance:camera.distanceTo(anchor),anchorInCameraSpace:this.relative(anchor).toArray()});if(this.samples.length>240)this.samples.shift();
 }
 diagnostic(){this.capture('export');return {version:'studio-space-0.10.0',viewport:this.viewportDiagnostic,canvasBuffer:{width:this.canvas.width,height:this.canvas.height,pixelRatio:this.actualRenderer?.getPixelRatio?.()},placementPolicy:{durationMs:1500,maxClusterRadius:.04,minSamples:12,maxSampleGapMs:250},units:'responsive engine units; not guaranteed meters',poseSampleIntervalMs:500,poseSampleLimit:240,placed:this.placed,tracking:this.tracking,scale:this.scale,baseScale:this.baseScale,displayMultiplier:this.displayMultiplier,project:this.projectSummary,animationPaused:!!this.debugPaused,events:this.events,poseSamples:this.samples};}
 stop(){this.generation++;this.running=false;this.pendingReject?.(new Error('空間ARの開始を中止しました。'));this.pendingReject=null;this.adapter?.stop();this.anchor.visible=false;this.placed=false;this.clearCandidate();this.loop=null;if(this.aimElement)this.aimElement.hidden=true;}
}
