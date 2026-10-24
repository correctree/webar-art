import {containRect} from './layout.js?v=012';
import {loadVision} from './loader.js?v=011';
import {facePlacement} from './geometry.js';
const $=id=>document.getElementById(id), video=$('video');
let THREE,renderer,scene,camera,root,model,detector,stream,raf=0,epoch=0,running=false,lastTime=-1,lastDetect=0,lastSeen=0,smoothed=false,frames=0,metricStart=0,assetEpoch=0;
let layoutKey='';
function syncLayout(){
 const w=video.videoWidth,h=video.videoHeight,box=$('stage');
 const rect=containRect(w,h,box.clientWidth,box.clientHeight);if(!rect)return;
 const key=[w,h,box.clientWidth,box.clientHeight,!!renderer].join(':');if(key===layoutKey)return;layoutKey=key;
 for(const element of [video,renderer?.domElement].filter(Boolean)){for(const name of ['width','height','left','top'])element.style[name]=rect[name]+'px';}
 if(renderer){renderer.setSize(w,h,false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
 smoothed=false;
}
video.addEventListener('loadedmetadata',syncLayout);video.addEventListener('resize',syncLayout);
window.addEventListener('resize',()=>{layoutKey='';syncLayout();});
const status=s=>$('status').textContent=s;
let stage='開始';
const phase=s=>{stage=s;status(s);};
const fail=e=>{status('停止しました');$('log').textContent=`段階: ${stage}\n${e.name||'Error'}: ${e.message||e}\nHTTPS・カメラ許可・通信状況を確認して、再度開始してください。`;};
function release(obj){obj?.traverse(o=>{o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});}
function replace(obj){if(model){root.remove(model);release(model);}model=obj;root.add(model);}
function standard(){if(!THREE)return;replace(new THREE.Mesh(new THREE.TorusKnotGeometry(.3,.09,64,8),new THREE.MeshStandardMaterial({color:0x70e2c2,metalness:.25,roughness:.3})));}
async function graphics(){if(renderer)return;THREE=await import('three');renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));$('stage').append(renderer.domElement);scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-320,320,240,-240,.1,3000);camera.position.z=1000;root=new THREE.Group();root.visible=false;scene.add(root,new THREE.HemisphereLight(0xffffff,0x445566,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(1,2,3);scene.add(light);standard();}
function stop(){layoutKey='';epoch++;running=false;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;video.pause();video.srcObject=null;detector?.close();detector=null;smoothed=false;if(root){root.visible=false;renderer.render(scene,camera);} $('start').disabled=false;$('stop').disabled=true;status('停止・カメラ解除');}
async function start(){stop();const token=epoch;$('start').disabled=true;$('stop').disabled=false;$('log').textContent='';status('カメラ・顔モデルの準備中…');try{
 if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('HTTPSで開いてください');
 phase('カメラ取得');const s=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:matchMedia('(orientation: portrait)').matches?480:640},height:{ideal:matchMedia('(orientation: portrait)').matches?640:480}}});if(token!==epoch){s.getTracks().forEach(t=>t.stop());return;}stream=s;video.srcObject=s;await video.play();phase('Three.js読込・描画初期化');await graphics();if(token!==epoch)return;layoutKey='';syncLayout();
 phase('MediaPipe読込');const {FaceLandmarker,files}=await loadVision({report:phase,isCancelled:()=>token!==epoch});if(token!==epoch)return;
 phase('顔モデル読込・GPU初期化');
 const options={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:1,outputFacialTransformationMatrixes:true};
 let d;try{d=await FaceLandmarker.createFromOptions(files,options);}catch(e){phase('顔モデル読込・CPU初期化');options.baseOptions.delegate='CPU';d=await FaceLandmarker.createFromOptions(files,options);}
 if(token!==epoch){d.close();return;}detector=d;stage='顔の推論・描画';running=true;lastTime=-1;lastDetect=0;lastSeen=0;frames=0;metricStart=performance.now();loop();
 }catch(e){if(token===epoch){stop();fail(e);}}}
function loop(){if(!running)return;try{const now=performance.now(),w=video.videoWidth,h=video.videoHeight;
 if(w&&h){syncLayout();
 if(video.readyState>=2&&video.currentTime!==lastTime&&now-lastDetect>=1000/Number($('rate').value)){lastTime=video.currentTime;lastDetect=now;const t=performance.now(),result=detector.detectForVideo(video,now),ms=performance.now()-t;const pose=facePlacement(result.faceLandmarks?.[0],w,h,$('anchor').value);const matrix=result.facialTransformationMatrixes?.[0]?.data;
 if(pose&&matrix){const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().fromArray(matrix));const a=smoothed?.5:1;root.position.lerp(new THREE.Vector3(pose.x,pose.y,0),a);root.quaternion.slerp(q,a);const scale=pose.span*Number($('scale').value);root.scale.lerp(new THREE.Vector3(scale,scale,scale),a);root.visible=true;smoothed=true;lastSeen=now;}else{root.visible=false;smoothed=false;}frames++;if(now-metricStart>=1000){status(`${pose?'顔を検出':'顔を探しています'} · ${(frames*1000/(now-metricStart)).toFixed(1)} 回/秒 · 推論 ${ms.toFixed(0)} ms · ${w}×${h}`);frames=0;metricStart=now;}}
 if(now-lastSeen>300){root.visible=false;smoothed=false;}renderer.render(scene,camera);}raf=requestAnimationFrame(loop);
 }catch(e){stop();fail(e);}}
$('start').onclick=start;$('stop').onclick=stop;$('anchor').onchange=()=>{smoothed=false;};$('reset').onclick=()=>{assetEpoch++;standard();$('file').value='';};
$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;const token=++assetEpoch;try{if(file.size>10*1024*1024)throw new Error('GLBは10MB以下にしてください');await graphics();const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(!url.startsWith('blob:')&&!url.startsWith('data:'))throw new Error('外部素材付きGLBには未対応です');return url;});const gltf=await new GLTFLoader(manager).parseAsync(await file.arrayBuffer(),'');if(token!==assetEpoch){release(gltf.scene);return;}const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z);if(!Number.isFinite(extent)||extent<=0){release(gltf.scene);throw new Error('形状がないGLBです');}gltf.scene.position.sub(box.getCenter(new THREE.Vector3()));const normalized=new THREE.Group();normalized.add(gltf.scene);normalized.scale.setScalar(1/extent);replace(normalized);$('log').textContent='GLB読込成功（静止表示・アニメーション再生は次段階）';}catch(e){$('log').textContent=e.message;}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
