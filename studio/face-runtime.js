import * as THREE from 'three';
// Shares the exact image-space placement and contain layout used in FACE LAB.
export class FaceRuntime {
 constructor({container,onStatus=()=>{},onError=()=>{}}){
  this.container=container;this.onStatus=onStatus;this.onError=onError;this.epoch=0;this.anchors=[];this.detected=false;
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-320,320,240,-240,.1,10000);this.camera.position.z=2000;
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  this.video=document.createElement('video');this.video.muted=true;this.video.autoplay=true;this.video.playsInline=true;this.video.setAttribute('playsinline','');
  for(const el of [this.video,this.renderer.domElement]){el.style.cssText='position:absolute;transform:scaleX(-1);object-fit:contain;';container.append(el);}
  this.video.hidden=true;this.renderer.domElement.hidden=true;
 }
 addAnchor(index){const group=new THREE.Group();group.matrixAutoUpdate=false;group.visible=false;this.anchors[index]={group};return this.anchors[index];}
 async start(){this.stop();const token=this.epoch;let pending;
  try{this.onStatus('前面カメラを起動しています');
   const portrait=matchMedia('(orientation: portrait)').matches;
   pending=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:portrait?480:640},height:{ideal:portrait?640:480}}});
   if(token!==this.epoch){pending.getTracks().forEach(t=>t.stop());return;}
   this.stream=pending;this.video.srcObject=pending;this.video.hidden=false;this.renderer.domElement.hidden=false;await this.video.play();
   const base=new URL('./face-lab/',location.href);
   const loader=await import(/* @vite-ignore */ new URL('loader.js',base).href);
   const placement=await import(/* @vite-ignore */ new URL('geometry.js',base).href);
   const layout=await import(/* @vite-ignore */ new URL('layout.js',base).href);
   if(token!==this.epoch)return;
   this.placement=placement.facePlacement;this.contain=layout.containRect;
   const {FaceLandmarker,files}=await loader.loadVision({report:this.onStatus,isCancelled:()=>token!==this.epoch});
   if(token!==this.epoch)return;this.onStatus('顔モデルを準備しています');
   const options={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:1,outputFacialTransformationMatrixes:true};
   let detector;try{detector=await FaceLandmarker.createFromOptions(files,options);}catch(e){if(token!==this.epoch)return;options.baseOptions.delegate='CPU';detector=await FaceLandmarker.createFromOptions(files,options);}
   if(token!==this.epoch){detector.close();return;}
   this.detector=detector;this.lastTime=-1;this.lastDetect=0;this.lastSeen=0;this.layoutKey='';this.live=true;this.update();
  }catch(e){if(token!==this.epoch)return;this.stop();throw e;}
 }
 update(){if(!this.live)return;try{
  const w=this.video.videoWidth,h=this.video.videoHeight,now=performance.now();if(!w||!h)return;
  const box=this.container,rect=this.contain(w,h,box.clientWidth,box.clientHeight);
  if(rect){const key=[w,h,box.clientWidth,box.clientHeight].join(':');if(key!==this.layoutKey){this.layoutKey=key;for(const el of [this.video,this.renderer.domElement])for(const k of ['left','top','width','height'])el.style[k]=rect[k]+'px';this.renderer.setSize(w,h,false);this.camera.left=-w/2;this.camera.right=w/2;this.camera.top=h/2;this.camera.bottom=-h/2;this.camera.updateProjectionMatrix();}}
  if(this.video.readyState>=2&&this.video.currentTime!==this.lastTime&&now-this.lastDetect>=1000/15){this.lastTime=this.video.currentTime;this.lastDetect=now;
   const result=this.detector.detectForVideo(this.video,now),points=result.faceLandmarks?.[0],matrix=result.facialTransformationMatrixes?.[0]?.data;
   const q=matrix?new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().fromArray(matrix)):null;this.detected=!!q&&!!points;
   for(let index=0;index<this.anchors.length;index++){const a=this.anchors[index];if(!a)continue;const pose=this.placement(points,w,h,index===0?'nose':'head');a.group.visible=!!pose&&!!q;if(a.group.visible)a.group.matrix.compose(new THREE.Vector3(pose.x,pose.y,0),q,new THREE.Vector3(pose.span,pose.span,pose.span));}
   if(this.detected)this.lastSeen=now;
  }
  if(now-this.lastSeen>300){this.detected=false;for(const a of this.anchors)if(a)a.group.visible=false;}
 }catch(e){this.stop();this.onError(e);}}
 stop(){this.epoch++;this.live=false;this.detected=false;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.video.pause();this.video.srcObject=null;this.video.hidden=true;this.renderer.domElement.hidden=true;this.detector?.close();this.detector=null;for(const a of this.anchors)if(a)a.group.visible=false;}
}
