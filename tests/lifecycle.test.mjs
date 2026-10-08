import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {TrackingState,errorMessage} from '../src/state.js';
async function harness({defer=false,deny=false}={}){
 const nodes=new Map();for(const k of ['start','stop','ar','status','diagnostics','size','x','y','angle'])nodes.set(k,{disabled:false,textContent:'',value:k==='size'?'0.2':'0',replaceChildren(){}});
 let resolveStart,stops=0,loops=0;
 class Adapter{async initialize(_,__,cb){this.cb=cb;return {scene:{},group:{},camera:{},renderer:{setAnimationLoop(){loops++},render(){}}};}async start(){if(deny)throw {name:'NotAllowedError'};if(defer)await new Promise(r=>resolveStart=r);}stop(){stops++;}}
 let code=await readFile(new URL('../src/app.js',import.meta.url),'utf8');code=code.replace(/^import .*;\n/gm,'').replace("await import('./artwork-view.js')",'await artwork()');
 const classes=new Set(),details={open:false},buttons={prepend(){}};
 const doc={
 getElementById:k=>nodes.get(k),
 addEventListener(){},hidden:false,
 body:{classList:{toggle(name,force){
 const enabled=force===undefined?!classes.has(name):force;
 if(enabled)classes.add(name);else classes.delete(name);
 return enabled;
 }}},
 createElement(){return {}},
 querySelector(selector){
 if(selector==='main details')return details;
 if(selector==='main .buttons')return buttons;
 throw new Error('Unexpected selector: '+selector);
 }
 };
 const run=new Function('MindARAdapter','TrackingState','errorMessage','targetStore','document','navigator','isSecureContext','fetch','URL','addEventListener','artwork',code);
 run(Adapter,TrackingState,errorMessage,async()=>new Blob(['target']),doc,{mediaDevices:{getUserMedia(){}}},true,async()=>({ok:false}),{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},()=>{},async()=>({createArtwork:()=>({update(){},dispose(){}})}));
 return {nodes,get stops(){return stops},get loops(){return loops},release(){resolveStart()},async pending(){for(let i=0;i<10;i++)await Promise.resolve();}};
}
test('stop during pending camera start prevents rendering and permits restart',async()=>{const h=await harness({defer:true});const first=h.nodes.get('start').onclick();await h.pending();await h.nodes.get('stop').onclick();h.release();await first;assert.equal(h.loops,0);assert.equal(h.nodes.get('start').disabled,false);assert.match(h.nodes.get('status').textContent,/終了/);assert.equal(h.stops,1);});
test('permission denial releases engine and permits retry',async()=>{const h=await harness({deny:true});await h.nodes.get('start').onclick();assert.equal(h.stops,1);assert.equal(h.nodes.get('start').disabled,false);assert.equal(h.nodes.get('stop').disabled,true);assert.match(h.nodes.get('status').textContent,/許可/);});
test('normal start / stop / restart',async()=>{const h=await harness();await h.nodes.get('start').onclick();assert.equal(h.nodes.get('stop').disabled,false);await h.nodes.get('stop').onclick();await h.nodes.get('start').onclick();assert.equal(h.loops,2);await h.nodes.get('stop').onclick();assert.equal(h.stops,2);});
