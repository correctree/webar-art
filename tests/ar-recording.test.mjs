import test from 'node:test';import assert from 'node:assert/strict';
import {ARRecording,recordingMime,containRect,installRecordingUI} from '../studio/ar-recording.js';
function setup({failDraw=false,bytes=4}={}){
 let stopped=0,now=0,timer;const states=[],ready=[],errors=[],draws=[];
 class Recorder{static isTypeSupported(t){return t==='video/mp4';}constructor(stream,options){this.state='inactive';this.mimeType=options.mimeType;}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob([new Uint8Array(bytes)],{type:this.mimeType})});this.onstop();}}
 const context={fillRect(){},drawImage(...args){if(failDraw)throw Error('blocked');draws.push(args);}};
 const rect={left:0,top:0,width:390,height:800},stage={getBoundingClientRect:()=>rect},canvas={getBoundingClientRect:()=>({...rect,left:-195,width:780})},background={readyState:4,getBoundingClientRect:()=>rect};
 const output={getContext:()=>context,captureStream:()=>({getTracks:()=>[{stop(){stopped++;}}]})};
 const recorder=new ARRecording({Recorder,createCanvas:()=>output,onState:s=>states.push(s),onReady:(b,e)=>ready.push({blob:b,ext:e}),onError:e=>errors.push(e.message),setTimer:fn=>{timer=fn;return 1;},clearTimer(){},now:()=>now});
 return {recorder,output,draws,ready,errors,states,stopped:()=>stopped,start:()=>recorder.start({stage,canvas,background}),timer:()=>timer(),advance:n=>now+=n};
}
test('recording prefers MP4 and uses supported WebM fallback',()=>{
 assert.equal(recordingMime({isTypeSupported:t=>t==='video/mp4'}),'video/mp4');assert.equal(recordingMime({isTypeSupported:t=>t==='video/webm'}),'video/webm');assert.equal(recordingMime(null),'');assert.deepEqual(containRect(100,200,200,200),{x:50,y:0,scale:1});
});
test('AR recording composites camera then artwork with CSS crop and leaves camera tracks alone',()=>{
 const s=setup();s.start();assert.equal(s.recorder.state,'recording');s.recorder.draw();assert.equal(s.draws.length,2);assert.equal(s.draws[1][1],-175);assert.equal(s.draws[1][3],702);s.recorder.draw();assert.equal(s.draws.length,2);s.advance(80);s.recorder.draw();assert.equal(s.draws.length,4);
 s.recorder.stop();assert.equal(s.stopped(),1);assert.equal(s.ready[0].ext,'mp4');assert.equal(s.ready[0].blob.size,4);assert.deepEqual(s.states,['recording','stopping','idle']);assert.equal(s.output.width,352);assert.equal(s.output.height,720);
});
test('recording duration bound stops once and supports a second recording',()=>{
 const s=setup();s.start();assert.throws(()=>s.start());s.timer();assert.equal(s.ready.length,1);s.recorder.stop();assert.equal(s.ready.length,1);s.start();s.recorder.stop();assert.equal(s.ready.length,2);assert.equal(s.stopped(),2);
});
test('capture errors and empty recordings release resources without offering an invalid video',()=>{
 const s=setup({failDraw:true});s.start();s.recorder.draw();assert.equal(s.ready.length,0);assert.equal(s.errors.length,1);assert.equal(s.stopped(),1);
 const empty=setup({bytes:0});empty.start();empty.recorder.stop();assert.equal(empty.ready.length,0);assert.match(empty.errors[0],/空/);
});
test('save UI invokes native file share only from the share button and never claims Photos save succeeded',async()=>{
 const ids=['capture-button','capture-stop','capture-diagnostic','capture-result','capture-note','capture-preview','capture-download','capture-share','capture-save-note','capture-close','capture-controls'],elements=Object.fromEntries(ids.map(id=>[id,{setAttribute(){},pause(){}}]));let shared=0;
 const ui=installRecordingUI({document:{getElementById:id=>elements[id]},navigator:{canShare:()=>true,share:()=>{shared++;return Promise.resolve();}},URLAPI:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},getSource:()=>{},isActive:()=>false});
 ui.recorder.onReady(new Blob(['video'],{type:'video/mp4'}),'mp4');assert.equal(shared,0);assert.equal(elements['capture-result'].hidden,false);assert.equal(elements['capture-share'].disabled,false);assert.match(elements['capture-download'].download,/\.mp4$/);
 elements['capture-share'].onclick();assert.equal(shared,1);await Promise.resolve();assert.match(elements['capture-save-note'].textContent,/写真アプリで確認/);
 elements['capture-close'].onclick();assert.equal(elements['capture-result'].hidden,true);
});
test('file download remains available when file share is unsupported',()=>{
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{setAttribute(){}});return elements.get(id);};
 const ui=installRecordingUI({document:{getElementById:get},navigator:{},URLAPI:{createObjectURL:()=> 'blob:webm',revokeObjectURL(){}},getSource:()=>{},isActive:()=>false});ui.recorder.onReady(new Blob(['video'],{type:'video/webm'}),'webm');assert.equal(get('capture-share').disabled,true);assert.equal(get('capture-download').href,'blob:webm');assert.match(get('capture-save-note').textContent,/WebM/);
});
function delayedSetup({throws=false}={}){
 const timers=new Map(),ready=[],errors=[];let next=0,tracksStopped=0;
 class DelayedRecorder{static isTypeSupported(t){return t==='video/mp4';}constructor(s,o){this.state='inactive';this.mimeType=o.mimeType;}start(...args){assert.equal(args.length,0);this.state='recording';}stop(){if(throws)throw Error('encoder failed');this.state='inactive';}}
 const output={getContext:()=>({fillRect(){},drawImage(){}}),captureStream:fps=>{assert.equal(fps,15);return {getTracks:()=>[{stop:()=>tracksStopped++}]};}},rect={left:0,top:0,width:390,height:800},stage={getBoundingClientRect:()=>rect};
 const r=new ARRecording({Recorder:DelayedRecorder,createCanvas:()=>output,onReady:b=>ready.push(b),onError:e=>errors.push(e.message),setTimer:(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id;},clearTimer:id=>timers.delete(id)});
 return {r,ready,errors,timers,stopped:()=>tracksStopped,start:()=>r.start({stage,canvas:stage}),timeout:()=>[...timers.values()].find(t=>t.ms===10000).fn()};
}
test('save waits for asynchronous final data and stop event, not just the stop button',()=>{
 const s=delayedSetup();s.start();const native=s.r.recorder;s.r.stop();assert.equal(s.r.state,'stopping');assert.equal(s.ready.length,0);
 native.ondataavailable({data:new Blob(['final video'])});assert.equal(s.ready.length,0);native.onstop();assert.equal(s.ready[0].size,11);assert.equal(s.r.state,'idle');assert.equal(s.timers.size,0);assert.equal(s.stopped(),1);
});
test('missing stop event times out, releases output capture, and ignores late events from an older recording',()=>{
 const s=delayedSetup();s.start();const lateData=s.r.recorder.ondataavailable,lateStop=s.r.recorder.onstop;s.r.stop();s.timeout();assert.equal(s.r.state,'idle');assert.equal(s.ready.length,0);assert.equal(s.stopped(),1);assert.match(s.errors[0],/10秒/);
 s.start();lateData({data:new Blob(['stale'])});lateStop();assert.equal(s.r.session.bytes,0);assert.equal(s.r.state,'recording');s.r.stop();s.r.recorder.ondataavailable({data:new Blob(['new'])});s.r.recorder.onstop();assert.equal(s.ready[0].size,3);
 assert.ok(s.r.diagnostic().events.some(e=>e.type==='finalize-timeout'));
});
test('native stop exception restores usable controls without generating a partial video',()=>{
 const s=delayedSetup({throws:true});s.start();s.r.stop();assert.equal(s.r.state,'idle');assert.equal(s.ready.length,0);assert.equal(s.stopped(),1);assert.equal(s.timers.size,0);assert.match(s.errors[0],/終了できません/);
});
test('dedicated stop button is enabled only while recording and remains separate from disabled start control',()=>{
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{setAttribute(){}});return elements.get(id);};
 const ui=installRecordingUI({document:{getElementById:get},getSource:()=>{},isActive:()=>true});
 ui.recorder.onState('recording');assert.equal(get('capture-button').disabled,true);assert.equal(get('capture-stop').hidden,false);assert.equal(get('capture-stop').disabled,false);
 let stopped=0;ui.recorder.stop=()=>{stopped++;ui.recorder.onState('stopping');};get('capture-stop').onclick({stopPropagation(){}});assert.equal(stopped,1);assert.equal(get('capture-stop').hidden,true);
 ui.recorder.onState('idle');assert.equal(get('capture-button').disabled,false);
});
test('browser timers retain the Window receiver through default timer callbacks during start, stop and timeout',()=>{
 const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,timers=new Map(),ready=[],errors=[];let next=0;
 globalThis.setTimeout=function(fn,ms){assert.equal(this,globalThis,'Window.setTimeout must receive Window');const id=++next;timers.set(id,{fn,ms});return id;};
 globalThis.clearTimeout=function(id){assert.equal(this,globalThis,'Window.clearTimeout must receive Window');timers.delete(id);};
 class Recorder{static isTypeSupported(t){return t==='video/mp4';}constructor(s,o){this.state='inactive';this.mimeType=o.mimeType;}start(){this.state='recording';}stop(){this.state='inactive';}}
 const stage={getBoundingClientRect:()=>({left:0,top:0,width:390,height:800})},output={getContext:()=>({}),captureStream:()=>({getTracks:()=>[{stop(){}}]})};
 try{
  const r=new ARRecording({Recorder,createCanvas:()=>output,onReady:blob=>ready.push(blob),onError:e=>errors.push(e.message)});
  r.start({stage,canvas:stage});assert.equal(r.state,'recording');assert.equal([...timers.values()][0].ms,30000);
  r.stop();assert.equal(r.state,'stopping');assert.equal(r.recorder.state,'inactive');assert.equal([...timers.values()][0].ms,10000);
  r.recorder.ondataavailable({data:new Blob(['video'])});r.recorder.onstop();assert.equal(r.state,'idle');assert.equal(ready[0].size,5);assert.equal(timers.size,0);
  r.start({stage,canvas:stage});[...timers.values()].find(t=>t.ms===30000).fn();assert.equal(r.state,'stopping');[...timers.values()].find(t=>t.ms===10000).fn();assert.equal(r.state,'idle');assert.equal(timers.size,0);assert.match(errors[0],/10秒/);
 }finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
});
