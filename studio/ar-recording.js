export function recordingMime(Recorder){
 for(const type of ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm'])if(Recorder?.isTypeSupported?.(type))return type;
 return '';
}
export function containRect(width,height,targetWidth,targetHeight){const scale=Math.min(targetWidth/width,targetHeight/height);return {x:(targetWidth-width*scale)/2,y:(targetHeight-height*scale)/2,scale};}
export class ARRecording {
 constructor({Recorder=globalThis.MediaRecorder,createCanvas=()=>document.createElement('canvas'),onState=()=>{},onReady=()=>{},onError=()=>{},maxMs=60000,maxBytes=64*1024*1024,setTimer=setTimeout,clearTimer=clearTimeout,now=()=>performance.now()}={}){
  Object.assign(this,{Recorder,createCanvas,onState,onReady,onError,maxMs,maxBytes,setTimer,clearTimer,now});this.state='idle';
 }
 start({stage,canvas,background=null}){
  if(this.state!=='idle')throw new Error('録画の処理中です。');if(!this.Recorder)throw new Error('このブラウザーはアプリ内録画に対応していません。端末の画面収録をご利用ください。');
  const rect=stage.getBoundingClientRect();if(!(rect.width>0&&rect.height>0))throw new Error('AR画面の準備ができていません。');
  const output=this.createCanvas(),scale=Math.min(1,1280/Math.max(rect.width,rect.height));output.width=Math.max(2,Math.round(rect.width*scale/2)*2);output.height=Math.max(2,Math.round(rect.height*scale/2)*2);
  const context=output.getContext('2d',{alpha:false});if(!context||!output.captureStream)throw new Error('このブラウザーではAR映像を録画できません。端末の画面収録をご利用ください。');
  const stream=output.captureStream(30);let recorder;try{const mimeType=recordingMime(this.Recorder);recorder=new this.Recorder(stream,{...(mimeType?{mimeType}:{}),videoBitsPerSecond:4000000});}catch(e){stream.getTracks().forEach(t=>t.stop());throw new Error('録画を開始できません：'+e.message);}
  Object.assign(this,{stage,canvas,background,output,context,stream,recorder,chunks:[],bytes:0,failed:false});
  recorder.ondataavailable=e=>{if(!e.data?.size)return;this.chunks.push(e.data);this.bytes+=e.data.size;if(this.bytes>=this.maxBytes)this.stop();};
  recorder.onerror=e=>{this.failed=true;this.onError(new Error('録画エラー：'+(e.error?.message||'映像を保存できませんでした。')));this.stop();};
  recorder.onstop=()=>{this.clearTimer(this.timer);stream.getTracks().forEach(t=>t.stop());const chunks=this.chunks,type=recorder.mimeType||chunks[0]?.type||'video/mp4';this.chunks=[];this.state='idle';this.onState('idle');if(this.failed)return;const blob=new Blob(chunks,{type});if(!blob.size){this.onError(new Error('録画データが空です。端末の画面収録をお試しください。'));return;}this.onReady(blob,type.startsWith('video/mp4')?'mp4':'webm');};
  try{recorder.start(1000);}catch(e){stream.getTracks().forEach(t=>t.stop());this.state='idle';throw e;}
  this.lastDraw=-Infinity;this.state='recording';this.onState('recording');this.timer=this.setTimer(()=>this.stop(),this.maxMs);
 }
 draw(){
  if(this.state!=='recording')return;const now=this.now();if(now-this.lastDraw<1000/30)return;this.lastDraw=now;
  try{const rect=this.stage.getBoundingClientRect(),fit=containRect(rect.width,rect.height,this.output.width,this.output.height),ctx=this.context;ctx.fillStyle='#000';ctx.fillRect(0,0,this.output.width,this.output.height);
   const layer=source=>{if(!source||source.readyState!==undefined&&source.readyState<2)return;const r=source.getBoundingClientRect();ctx.drawImage(source,fit.x+(r.left-rect.left)*fit.scale,fit.y+(r.top-rect.top)*fit.scale,r.width*fit.scale,r.height*fit.scale);};
   layer(this.background);layer(this.canvas);
  }catch(e){this.failed=true;this.onError(new Error('録画映像を取得できません：'+e.message));this.stop();}
 }
 stop(){if(this.state!=='recording')return;this.state='stopping';this.clearTimer(this.timer);this.onState('stopping');if(this.recorder.state!=='inactive')this.recorder.stop();}
}
export function installRecordingUI({getSource,isActive,document:doc=globalThis.document,navigator:nav=globalThis.navigator,URLAPI=globalThis.URL,FileClass=globalThis.File,Recorder=globalThis.MediaRecorder}={}){
 const $=id=>doc.getElementById(id);let file=null,url=null,elapsed=0,ticker;
 const recorder=new ARRecording({Recorder,onState:state=>{clearInterval(ticker);$('capture-button').disabled=state==='stopping';$('capture-button').setAttribute('aria-pressed',String(state==='recording'));if(state==='recording'){elapsed=0;$('capture-result').hidden=true;$('capture-note').textContent='無音・最長60秒。画面の向きを固定してください。';$('capture-button').textContent='● 00:00 停止';ticker=setInterval(()=>{elapsed++;$('capture-button').textContent='● '+String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0')+' 停止';},1000);}else $('capture-button').textContent=state==='stopping'?'動画を準備中…':'● 動画を撮影';},onError:e=>{$('capture-note').textContent=e.message;},onReady:(blob,extension)=>{
  if(url)URLAPI.revokeObjectURL(url);url=URLAPI.createObjectURL(blob);file=new FileClass([blob],'ARARART-'+new Date().toISOString().replace(/[:.]/g,'-')+'.'+extension,{type:blob.type});
  $('capture-preview').src=url;$('capture-preview').muted=true;$('capture-download').href=url;$('capture-download').download=file.name;
  let shareable=false;try{shareable=!!nav.share&&!!nav.canShare?.({files:[file]});}catch{}
  $('capture-share').disabled=!shareable;$('capture-save-note').textContent=extension==='mp4'?'共有メニューで「ビデオを保存」が表示されたら選択してください。保存完了は写真アプリで確認してください。':'この端末はWebM形式です。共有先や写真アプリによっては保存できません。「ダウンロード」でファイルとして保存できます。';
  if(!shareable)$('capture-save-note').textContent+=' このブラウザーは動画ファイルの共有に対応していません。';
  $('capture-result').hidden=false;$('capture-note').textContent='録画ができました。プレビューと保存先を確認してください。';
 }});
 $('capture-button').onclick=()=>{if(recorder.state==='recording'){recorder.stop();return;}if(!isActive())return;try{recorder.start(getSource());}catch(e){$('capture-note').textContent=e.message;}};
 $('capture-share').onclick=()=>{if(!file)return;try{Promise.resolve(nav.share({files:[file]})).then(()=>{$('capture-save-note').textContent='共有メニューを閉じました。写真への保存は写真アプリで確認してください。';}).catch(e=>{if(e.name!=='AbortError')$('capture-save-note').textContent='共有できませんでした。「ダウンロード」で保存してください。';});}catch{$('capture-save-note').textContent='共有できませんでした。「ダウンロード」で保存してください。';}};
 $('capture-close').onclick=()=>{$('capture-preview').pause();$('capture-result').hidden=true;};
 return {draw:()=>recorder.draw(),stop:()=>recorder.stop(),setActive:value=>{$('capture-controls').hidden=!value;},recorder};
}
