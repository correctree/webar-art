import {MindARAdapter} from './mindar-adapter.js';
import {TrackingState,errorMessage} from './state.js';
import {targetStore} from './store.js';
const $=id=>document.getElementById(id),state=new TrackingState();let adapter,view,url,busy=false,running=false,cancel=false;
const labels={idle:'黒枠なしの作品を映してください',starting:'カメラを準備しています…',searching:'認識中：作品全体を映してください',tracking:'追跡中',reacquired:'再取得：追跡中',lost:'見失いました：作品へカメラを戻してください',stopped:'カメラを終了しました',error:'エラー'};
function status(type,detail){state.event(type);$('status').textContent=detail||labels[state.value];$('diagnostics').textContent=`状態 ${state.value} / 取得 ${state.found} / 見失い ${state.lost}
画像追跡：MindAR 1.2.5 / 描画：WebGL
WebGPU API ${'gpu' in navigator?'あり':'なし'} / WebXR API ${'xr' in navigator?'あり':'なし'}
APIの存在は空間AR対応を保証しません`;}
function update(){view?.update(Object.fromEntries(['size','x','y','angle'].map(k=>[k,Number($(k).value)])));}
function cleanup(){try{adapter?.stop();}finally{adapter=null;view?.dispose();view=null;if(url)URL.revokeObjectURL(url);url=null;$('ar').replaceChildren();running=false;}}
async function stop(){cancel=true;if(busy){$('status').textContent='準備完了後に終了します…';return;}cleanup();$('start').disabled=false;$('stop').disabled=true;status('stopped');}
$('start').onclick=async()=>{if(busy||running)return;busy=true;cancel=false;$('start').disabled=true;$('stop').disabled=false;status('starting');try{
 if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('HTTPSまたはlocalhostで開いてください');
 let blob;const response=await fetch('public/targets/mk_1008.mind');if(response.ok)blob=await response.blob();else blob=await targetStore();
 if(!blob)throw new Error('先に「初回：認識データを作成」を開いてください');
 if(cancel)return;url=URL.createObjectURL(blob);adapter=new MindARAdapter();const context=await adapter.initialize($('ar'),url,type=>{if(!cancel)status(type);});
 if(cancel)return;const {createArtwork}=await import('./artwork-view.js');if(cancel)return;view=createArtwork(context.scene,context.group);update();await adapter.start();if(cancel)return;
 running=true;if(!['tracking','reacquired'].includes(state.value))status('searching');context.renderer.setAnimationLoop(()=>context.renderer.render(context.scene,context.camera));
 }catch(e){cleanup();status('error',errorMessage(e));}finally{busy=false;if(cancel){cleanup();status('stopped');}$('start').disabled=running;$('stop').disabled=!running;}};
$('stop').onclick=stop;for(const k of ['size','x','y','angle'])$(k).oninput=update;
addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||busy))stop();});status('idle');
