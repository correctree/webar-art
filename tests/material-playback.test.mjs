import test from 'node:test';import assert from 'node:assert/strict';
import {ActionSequence,defaultAction,defaultSequence,validateSequence} from '../studio/action-sequence.js';
import {materialPlayback,materialControlled,materialStartsManually} from '../studio/material-playback.js';
const seq=actions=>({...defaultSequence(),enabled:true,actions}),play=(over={})=>({...defaultAction('mediaPlay'),...over}),move=()=>({...defaultAction('move'),offset:[1,0,0]});
const tick=()=>Promise.resolve();
test('Sprite restart/resume, material-only pause, loop and actual final-frame duration',async()=>{
 const item={spec:{kind:'sprite',sprite:{frames:12,fps:6},interaction:{loop:true}},time:1,playing:false,paused:true},errors=[],env={sync:()=>Promise.resolve(),onError:e=>errors.push(e)};
 let task=materialPlayback(item,play({wait:true}),env);assert.equal(item.time,0);assert.equal(item.playing,true);assert.equal(item.paused,false);await tick();item.time=1.99;assert.equal(task.done,false);item.time=2;assert.equal(task.done,true);
 materialPlayback(item,{type:'mediaPause'},env);assert.equal(item.playing,false);assert.equal(item.time,2);task=materialPlayback(item,play({start:'resume',loop:true}),env);await tick();assert.equal(item.time,2);assert.equal(task.done,false);assert.equal(item.mediaLoop,true);assert.deepEqual(errors,[]);
});
test('video waits for real ended state; rejected play returns failed task and reports error',async()=>{
 const video={duration:3,currentTime:2,ended:false},item={spec:{kind:'video'},video,time:0},env={sync:()=>Promise.resolve()};const task=materialPlayback(item,play({wait:true}),env);await tick();assert.equal(video.currentTime,0);video.currentTime=3;assert.equal(task.done,false);video.ended=true;assert.equal(task.done,true);
 let error;const failed=materialPlayback(item,play({wait:true}),{sync:()=>Promise.reject(Error('play blocked')),onError:e=>error=e});await tick();assert.equal(failed.failed,true);assert.match(error.message,/blocked/);assert.equal(item.playing,false);
});
test('GLB clip selection, continuation times, restart, full clip completion and missing clip rejection',async()=>{
 const clips=[{name:'walk',duration:2},{name:'wave',duration:4}],actions=new Map(clips.map(c=>[c.name,{time:c.name==='walk'?1:2,paused:true}])),item={spec:{kind:'glb',interaction:{}},clips,mixer:{clipAction:c=>actions.get(c.name)},time:0};
 const env={configure:(i,b)=>{for(const c of clips)actions.get(c.name).time=0;i.selected=b.clip;i.loop=b.loop;},sync:()=>Promise.resolve()};
 let task=materialPlayback(item,play({clip:'walk',start:'resume',wait:true}),env);await tick();assert.equal(actions.get('walk').time,1);assert.equal(actions.get('walk').paused,false);assert.equal(task.done,false);actions.get('walk').time=2;assert.equal(task.done,true);
 task=materialPlayback(item,play({clip:'all',wait:true}),env);await tick();assert.equal(actions.get('walk').time,0);actions.get('walk').time=2;assert.equal(task.done,false);actions.get('wave').time=4;assert.equal(task.done,true);assert.throws(()=>materialPlayback(item,play({clip:'missing'}),env),/見つかりません/);assert.throws(()=>materialPlayback({...item,clips:[]},play(),env),/含まれていません/);
});
test('sequential wait does not advance until task done, failures stop safely, non-wait emits once',()=>{
 let count=0,task={done:false};const s=new ActionSequence(seq([play({wait:true}),move()]),()=>{count++;return task;});s.tap();s.update(10);assert.equal(s.index,0);assert.equal(count,1);s.update(1);assert.equal(count,1);task.done=true;s.update(.5);assert.equal(s.pose.position[0],.5);s.update(.5);assert.equal(s.active,false);
 const f=new ActionSequence(seq([play({wait:true}),move()]),()=>({failed:true}));f.tap();f.update(1);assert.equal(f.active,false);assert.equal(f.pose.position[0],0);
 const n=new ActionSequence(seq([play(),move()]),()=>{count++;});n.tap();n.update(.5);assert.equal(n.pose.position[0],.5);
});
test('parallel movement completes while material waits; next ACTION waits for both',()=>{
 const task={done:false},s=new ActionSequence(seq([{type:'parallel',actions:[move(),play({wait:true})]}, {...move(),offset:[0,1,0]}]),()=>task);s.tap();s.update(.5);assert.equal(s.pose.position[0],.5);s.update(1);assert.equal(s.pose.position[0],1);assert.equal(s.index,0);task.done=true;s.update(.1);assert.equal(s.index,1);s.update(.5);assert.deepEqual(s.pose.position,[1,.5,0]);
});
test('loop and wait cannot coexist; duplicate material writers and malformed fields are rejected',()=>{
 validateSequence(seq([{type:'parallel',actions:[move(),play()]}]));for(const a of [play({wait:true,loop:true}),play({start:'invalid'}),play({clip:123})])assert.throws(()=>validateSequence(seq([a])));assert.throws(()=>validateSequence(seq([{type:'parallel',actions:[play(),defaultAction('mediaPause')]}])));
 const spec={interaction:{sequence:seq([play()])}};assert.equal(materialControlled(spec),true);assert.equal(materialStartsManually(spec),true);spec.interaction.sequence.actions=[defaultAction('mediaPause')];assert.equal(materialControlled(spec),true);assert.equal(materialStartsManually(spec),false);
});
test('material pause in parallel stops Sprite playback but allows object translation to continue',()=>{const item={spec:{kind:'sprite'},time:1,playing:true},s=new ActionSequence(seq([{type:'parallel',actions:[defaultAction('mediaPause'),move()]}]),a=>materialPlayback(item,a,{sync:()=>Promise.resolve()}));s.tap();s.update(.5);assert.equal(item.playing,false);assert.equal(item.time,1);assert.equal(s.pose.position[0],.5);assert.equal(s.pose.paused,false);});
