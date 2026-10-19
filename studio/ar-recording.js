export function recordingMime(Recorder){
 for(const type of ['video/mp4','video/mp4;codecs=avc1.42E01E','video/webm;codecs=vp8','video/webm'])if(Recorder?.isTypeSupported?.(type))return type;
 return '';
}
export function containRect(width,height,targetWidth,targetHeight){const scale=Math.min(targetWidth/width,targetHeight/height);return {x:(targetWidth-width*scale)/2,y:(targetHeight-height*scale)/2,scale};}
export class ARRecording {
 constructor({Recorder=globalThis.MediaRecorder,createCanvas=()=>document.createElement('canvas'),onState=()=>{},onReady=()=>{},onError=()=>{},maxMs=30000,maxBytes=64*1024*1024,finalizeMs=10000,setTimer=(...args)=>globalThis.setTimeout(...args),clearTimer=id=>globalThis.clearTimeout(id),now=()=>performance.now()}={}){
  Object.assign(this,{Recorder,createCanvas,onState,onReady,onError,maxMs,maxBytes,finalizeMs,setTimer,clearTimer,now});this.state='idle';this.events=[];
 }
 log(type,value={}){this.events.push({time:new Date().toISOString(),type,value});if(this.events.length>100)this.events.shift();}
 diagnostic(){return {version:'recording-0.12.2',state:this.state,nativeState:this.recorder?.state,mime:this.recorder?.mimeType,bytes:this.session?.bytes||0,frames:this.session?.frames||0,userAgent:globalThis.navigator?.userAgent,events:this.events};}
 start({stage,canvas,background=null}){
  if(this.state!=='idle')throw new Error('録画の処理中です。');if(!this.Recorder)throw new Error('このブラウザーはアプリ内録画に対応していません。端末の画面収録をご利用ください。');
  const rect=stage.getBoundingClientRect();if(!(rect.width>0&&rect.height>0))throw new Error('AR画面の準備ができていません。');
  const output=this.createCanvas(),scale=Math.min(1,720/Math.max(rect.width,rect.height));output.width=Math.max(2,Math.round(rect.width*scale/2)*2);output.height=Math.max(2,Math.round(rect.height*scale/2)*2);
  const context=output.getContext('2d',{alpha:false});if(!context||!output.captureStream)throw new Error('このブラウザーではAR映像を録画できません。端末の画面収録をご利用ください。');
  const stream=output.captureStream(15);let recorder;try{const mimeType=recordingMime(this.Recorder);recorder=new this.Recorder(stream,{...(mimeType?{mimeType}:{}),videoBitsPerSecond:2000000});}catch(e){stream.getTracks().forEach(t=>t.stop());throw new Error('録画を開始できません：'+e.message);}
  const session={stream,recorder,chunks:[],bytes:0,frames:0,closed:false,failed:false};Object.assign(this,{stage,canvas,background,output,context,stream,recorder,session});
  const finish=timeout=>{
   if(session.closed)return;session.closed=true;this.clearTimer(session.timer);this.clearTimer(session.finalizeTimer);
   recorder.ondataavailable=null;recorder.onstop=null;recorder.onerror=null;
   if(timeout&&recorder.state!=='inactive')try{recorder.stop();}catch{}
   stream.getTracks().forEach(t=>t.stop());this.state='idle';this.log(timeout?'finalize-timeout':'finished',{bytes:session.bytes,frames:session.frames});this.onState('idle');
   if(timeout){session.chunks=[];this.onError(new Error('動画の終了処理が10秒以内に完了しませんでした。録画診断を保存できます。短い録画か端末の画面収録をお試しください。'));return;}
   if(session.failed){session.chunks=[];return;}
   try{const type=recorder.mimeType||session.chunks[0]?.type||'video/mp4',blob=new Blob(session.chunks,{type});session.chunks=[];if(!blob.size)throw new Error('録画データが空です。端末の画面収録をお試しください。');this.onReady(blob,type.startsWith('video/mp4')?'mp4':'webm');}catch(e){this.log('result-error',{message:e.message});this.onError(e);}
  };
  session.finish=finish;
  recorder.ondataavailable=e=>{if(session.closed)return;this.log('data',{size:e.data?.size||0});if(!e.data?.size)return;session.chunks.push(e.data);session.bytes+=e.data.size;if(session.bytes>=this.maxBytes)this.stop('size-limit');};
  recorder.onerror=e=>{if(session.closed)return;session.failed=true;this.log('error',{message:e.error?.message});this.onError(new Error('録画エラー：'+(e.error?.message||'映像を保存できませんでした。')));if(this.state==='recording')this.stop('error');else if(recorder.state==='inactive')finish(false);};
  recorder.onstop=()=>finish(false);
  try{recorder.start();}catch(e){session.closed=true;stream.getTracks().forEach(t=>t.stop());this.state='idle';throw e;}
  this.lastDraw=-Infinity;this.state='recording';this.log('started',{mime:recorder.mimeType,width:output.width,height:output.height,fps:15});this.onState('recording');session.timer=this.setTimer(()=>this.stop('duration-limit'),this.maxMs);
 }
 draw(){
  const session=this.session;if(!session||session.closed||session.failed||!['recording','stopping'].includes(this.state))return;const now=this.now();if(now-this.lastDraw<1000/(this.state==='stopping'?5:15))return;this.lastDraw=now;
  try{const rect=this.stage.getBoundingClientRect(),fit=containRect(rect.width,rect.height,this.output.width,this.output.height),ctx=this.context;ctx.fillStyle='#000';ctx.fillRect(0,0,this.output.width,this.output.height);
   const layer=source=>{if(!source||source.readyState!==undefined&&source.readyState<2)return;const r=source.getBoundingClientRect();ctx.drawImage(source,fit.x+(r.left-rect.left)*fit.scale,fit.y+(r.top-rect.top)*fit.scale,r.width*fit.scale,r.height*fit.scale);};
   layer(this.background);layer(this.canvas);session.frames++;
  }catch(e){session.failed=true;this.log('draw-error',{message:e.message});this.onError(new Error('録画映像を取得できません：'+e.message));this.stop('draw-error');}
 }
 stop(reason='button'){
  if(this.state!=='recording')return;const session=this.session;this.state='stopping';this.clearTimer(session.timer);this.log('stop-request',{reason,nativeState:this.recorder.state});this.onState('stopping');
  session.finalizeTimer=this.setTimer(()=>session.finish(true),this.finalizeMs);
  try{session.stream.getVideoTracks?.()[0]?.requestFrame?.();if(this.recorder.state!=='inactive')this.recorder.stop();}catch(e){session.failed=true;this.log('stop-error',{message:e.message});session.finish(false);this.onError(new Error('録画を終了できません：'+e.message));}
 }
}
export function installRecordingUI({getSource,isActive,document:doc=globalThis.document,navigator:nav=globalThis.navigator,URLAPI=globalThis.URL,FileClass=globalThis.File,Recorder=globalThis.MediaRecorder,recordingOptions={}}={}){
 const $=id=>doc.getElementById(id);let file=null,url=null,elapsed=0,ticker;
 const recorder=new ARRecording({...recordingOptions,Recorder,createCanvas:recordingOptions.createCanvas||(()=>doc.createElement('canvas')),onState:state=>{clearInterval(ticker);$('capture-button').disabled=state!=='idle';$('capture-stop').hidden=state!=='recording';$('capture-stop').disabled=state!=='recording';$('capture-button').setAttribute('aria-pressed',String(state==='recording'));if(state==='recording'){elapsed=0;$('capture-result').hidden=true;$('capture-note').textContent='無音・最長30秒。赤い「停止して保存へ」で終了します。';$('capture-button').textContent='録画中 00:00';ticker=setInterval(()=>{elapsed++;$('capture-button').textContent='録画中 '+String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');},1000);}else $('capture-button').textContent=state==='stopping'?'動画を準備中…':'● 動画を撮影';},onError:e=>{$('capture-note').textContent=e.message;$('capture-diagnostic').hidden=false;},onReady:(blob,extension)=>{
  if(url)URLAPI.revokeObjectURL(url);url=URLAPI.createObjectURL(blob);file=new FileClass([blob],'ARARART-'+new Date().toISOString().replace(/[:.]/g,'-')+'.'+extension,{type:blob.type});
  $('capture-preview').src=url;$('capture-preview').muted=true;$('capture-download').href=url;$('capture-download').download=file.name;
  let shareable=false;try{shareable=!!nav.share&&!!nav.canShare?.({files:[file]});}catch{}
  $('capture-share').disabled=!shareable;$('capture-save-note').textContent=extension==='mp4'?'共有メニューで「ビデオを保存」が表示されたら選択してください。保存完了は写真アプリで確認してください。':'この端末はWebM形式です。共有先や写真アプリによっては保存できません。「ダウンロード」でファイルとして保存できます。';
  if(!shareable)$('capture-save-note').textContent+=' このブラウザーは動画ファイルの共有に対応していません。';
  $('capture-result').hidden=false;$('capture-note').textContent='録画ができました。プレビューと保存先を確認してください。';
 }});
 $('capture-button').onclick=()=>{if(recorder.state==='recording'){recorder.stop();return;}if(!isActive())return;try{recorder.start(getSource());}catch(e){recorder.log('start-error',{message:e.message});$('capture-note').textContent=e.message;$('capture-diagnostic').hidden=false;}};
 $('capture-stop').onclick=event=>{event?.stopPropagation?.();recorder.stop();};
 $('capture-diagnostic').onclick=()=>{const blob=new Blob([JSON.stringify(recorder.diagnostic(),null,2)],{type:'application/json'}),link=doc.createElement('a'),href=URLAPI.createObjectURL(blob);link.href=href;link.download='ararart-recording-diagnostic.json';link.click();setTimeout(()=>URLAPI.revokeObjectURL(href),1000);};
 $('capture-share').onclick=()=>{if(!file)return;try{Promise.resolve(nav.share({files:[file]})).then(()=>{$('capture-save-note').textContent='共有メニューを閉じました。写真への保存は写真アプリで確認してください。';}).catch(e=>{if(e.name!=='AbortError')$('capture-save-note').textContent='共有できませんでした。「ダウンロード」で保存してください。';});}catch{$('capture-save-note').textContent='共有できませんでした。「ダウンロード」で保存してください。';}};
 $('capture-close').onclick=()=>{$('capture-preview').pause();$('capture-result').hidden=true;};
 return {draw:()=>recorder.draw(),stop:()=>recorder.stop(),setActive:value=>{$('capture-controls').hidden=!value;},recorder};
}
