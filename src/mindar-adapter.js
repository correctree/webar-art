// Engine-specific API stays in this module. Rendering consumes only renderer/scene/camera/anchor.
export class MindARAdapter {
 async initialize(container,targetURL,onEvent){
 const {MindARThree}=await import('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js');
 const baseline=new URLSearchParams(location.search).get('tracking')==='baseline';
 const profile=baseline?{warmupTolerance:5,missTolerance:5}:{warmupTolerance:3,missTolerance:8,filterMinCF:0.0008,filterBeta:500};
 this.engine=new MindARThree({container,imageTargetSrc:targetURL,maxTrack:1,uiLoading:'no',uiScanning:'no',uiError:'no',...profile});
 this.anchor=this.engine.addAnchor(0);this.anchor.onTargetFound=()=>onEvent('found');this.anchor.onTargetLost=()=>onEvent('lost');
 return {renderer:this.engine.renderer,scene:this.engine.scene,camera:this.engine.camera,group:this.anchor.group};
 }
 async start(){await this.engine.start();}
 stop(){if(!this.engine)return;this.engine.renderer.setAnimationLoop(null);try{this.engine.stop();}finally{const v=this.engine.video;if(v?.srcObject){v.srcObject.getTracks().forEach(t=>t.stop());v.srcObject=null;}v?.remove();this.engine.renderer.dispose();this.engine.renderer.domElement.remove();this.engine=null;}}
}
