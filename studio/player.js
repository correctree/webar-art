import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';
import * as THREE from 'three';
import {MediaScene} from './media.js';
import {AudioBank} from './audio.js';
import {Behavior} from './behavior.js';
import {installTapInput,screenPoint,chooseScreenObject} from './tap-input.js';
import {sceneId,toProject} from './schema.js';
const $=id=>document.getElementById(id);let mind,media,audio,behavior,project,ready=false,active=false,busy=false,epoch=0;
const clock=new THREE.Clock(),visible=new Set(),anchors=new Map();
function error(e){$('error').textContent=e.message||String(e);}
function gates(){for(const s of project.scenes)for(const o of s.objects){const item=media.items.get(o.id);item.group.visible=s===behavior.scene;media.setGate(o.id,s===behavior.scene&&(s.markerLost==='continue'||visible.has(o.markerId)));}}
function enter(scene){for(const s of project.scenes)for(const o of s.objects){media.reset(o.id);media.setPlaying(o.id,s===scene&&o.autoplay).catch(error);}gates();$('scenes').value=scene.id;$('scene-label').textContent=scene.name;}
function stop(){epoch++;active=false;mind?.renderer.setAnimationLoop(null);mind?.stop();behavior?.stop();media?.pause();audio?.stopAll();visible.clear();$('start').hidden=false;$('start').disabled=!ready;$('stop').hidden=true;$('resume').hidden=true;$('status').textContent='終了しました。再度開始できます。';}
try {
 const id=new URLSearchParams(location.search).get('scene')||'demo';if(!sceneId(id))throw new Error('体験IDが不正です。');
 const base=new URL('./scenes/'+id+'/',location.href),response=await fetch(new URL('scene.json',base),{cache:'no-store'});if(!response.ok)throw new Error('公開作品が見つかりません。');
 project=toProject(await response.json());$('title').textContent=project.title;
 for(const marker of project.markers){const a=document.createElement('a');a.href=new URL(marker.image,base);a.target='_blank';a.rel='noopener';a.textContent=marker.name+'を表示';$('markers').append(a,document.createElement('br'));}
 for(const s of project.scenes){const o=document.createElement('option');o.value=s.id;o.textContent=s.name;$('scenes').append(o);}
 mind=new MindARThree({container:$('stage'),imageTargetSrc:new URL(project.trackingTarget,base).href,maxTrack:project.maxTrack,uiLoading:'no',uiScanning:'no',uiError:'no',filterMinCF:.001,filterBeta:.01,warmupTolerance:5,missTolerance:5});
 media=new MediaScene(name=>new URL(name,base).href,new URL('./',location.href));media.pause();media.onPlaybackError=e=>{$('resume').hidden=false;error(new Error('動画の再生には「動画を再生」を押してください。'));};audio=new AudioBank(name=>new URL(name,base).href);
 mind.scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(1,2,3);mind.scene.add(light);
 for(const marker of project.markers){const a=mind.addAnchor(marker.targetIndex);anchors.set(marker.id,a);a.onTargetFound=()=>{visible.add(marker.id);gates();$('status').textContent='作品をタップすると反応します。';};a.onTargetLost=()=>{visible.delete(marker.id);if(behavior.scene.markerLost==='pause')for(const o of behavior.scene.objects.filter(o=>o.markerId===marker.id))audio.stop(o.id);gates();if(!visible.size)$('status').textContent='マーカーへカメラを向けてください。';};}
 for(const s of project.scenes)for(const o of s.objects){const item=await media.add(o);anchors.get(o.markerId).group.add(item.group);}
 await audio.load(project.sounds);
 behavior=new Behavior(project,{leave:()=>audio.stopAll(),enter,tap:(o,playing)=>{const i=o.interaction;if(i.action==='restart')media.restart(o.id).catch(error);else if(i.action==='toggle')media.setPlaying(o.id,playing).catch(error);media.effect(o.id);if(i.action!=='toggle'||playing){try{audio.play(o);}catch(e){error(e);}}else audio.stop(o.id);}});behavior.enter(project.initialSceneId);
 $('scenes').onchange=()=>{if(active)behavior.enter($('scenes').value);};$('mute').onclick=()=>{audio.enabled=!audio.enabled;if(!audio.enabled)audio.stopAll();$('mute').textContent=audio.enabled?'音 ON':'音 OFF';};
 const ray=new THREE.Raycaster(),canvas=mind.renderer.domElement;let tapCount=0;
 function activate(id){const o=behavior.scene.objects.find(o=>o.id===id);if(!o||!visible.has(o.markerId))return;audio.unlock().catch(error);try{$('error').textContent='';if(behavior.tap(id)){$('status').textContent='タップ受付 '+(++tapCount)+'：'+o.name;}}catch(e){error(e);}}
 function pick(x,y){const rect=canvas.getBoundingClientRect(),point=screenPoint(x,y,rect);if(!point)return;mind.scene.updateMatrixWorld(true);mind.camera.updateMatrixWorld(true);ray.setFromCamera(new THREE.Vector2(point.x,point.y),mind.camera);const objects=behavior.scene.objects.filter(o=>visible.has(o.markerId)),roots=objects.map(o=>media.items.get(o.id).group);const hits=ray.intersectObjects(roots,true);let id=null;if(hits.length){let node=hits[0].object;while(node&&!node.userData.objectId)node=node.parent;id=node?.userData.objectId;}
  if(!id){const bounds=objects.map(o=>{const box=new THREE.Box3().setFromObject(media.items.get(o.id).group),points=[];if(!box.isEmpty())for(const a of [box.min.x,box.max.x])for(const b of [box.min.y,box.max.y])for(const c of [box.min.z,box.max.z]){const p=new THREE.Vector3(a,b,c).project(mind.camera);points.push({x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2,z:p.z});}return{id:o.id,points};});id=chooseScreenObject(x,y,bounds);}
  if(id)activate(id);else $('status').textContent=visible.size?'タップを受け取りました。作品の中心をタップしてください。':'マーカーへカメラを向けてください。';
 }
 installTapInput({surface:document,isActive:()=>active,isUI:target=>!!target?.closest?.('.ar-ui'),onTap:(x,y)=>{try{pick(x,y);}catch(e){error(e);}},pointer:typeof window.PointerEvent!=='undefined'});
 $('test-reaction').onclick=()=>{if(!active)return;const o=behavior.scene.objects.find(o=>visible.has(o.markerId)&&o.interaction.action!=='none')||behavior.scene.objects.find(o=>visible.has(o.markerId));if(o)activate(o.id);else $('status').textContent='マーカー認識後に反応を確認できます。';};

 ready=true;$('start').disabled=false;$('status').textContent='ARを開始し、印刷したマーカーにカメラを向けてください。';
 $('resume').onclick=()=>{audio.unlock().catch(error);media.primeVideos().then(r=>$('resume').hidden=!r.some(x=>x.status==='rejected'));};
 $('start').onclick=async()=>{if(busy||active)return;busy=true;const startEpoch=++epoch;$('start').disabled=true;$('error').textContent='';behavior.enter(project.initialSceneId);const unlock=audio.unlock();media.playing=true;const playback=media.primeVideos();try{await unlock;await mind.start();if(startEpoch!==epoch||document.hidden){stop();return;}active=true;behavior.running=true;clock.start();mind.renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.1);behavior.update(dt);media.update(dt);mind.renderer.render(mind.scene,mind.camera);});$('start').hidden=true;$('stop').hidden=false;$('status').textContent='マーカーへカメラを向けてください。';$('resume').hidden=!(await playback).some(r=>r.status==='rejected');}catch(e){stop();error(new Error('開始できません: '+e.message+' Safariのカメラ許可を確認してください。'));}finally{busy=false;$('start').disabled=false;}};
 $('stop').onclick=stop;document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stop();});window.addEventListener('pagehide',stop);
}catch(e){error(e);$('status').textContent='準備できませんでした。';}
