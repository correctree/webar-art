/** Edge-triggered inputs. Distances are marker-width units, never metres. */
export function defaultTriggers(){return{sound:{enabled:false,threshold:.05,cooldown:2},near:{enabled:false,distance:3,cooldown:2}};}
export function validateTriggers(t){if(t===undefined)return;if(!t||typeof t!=='object')throw Error('トリガー設定が不正です。');for(const [kind,key,min,max]of [['sound','threshold',.005,1],['near','distance',.2,50]]){const x=t[kind];if(!x||typeof x.enabled!=='boolean'||!Number.isFinite(x[key])||x[key]<min||x[key]>max||!Number.isFinite(x.cooldown)||x.cooldown<.5||x.cooldown>60)throw Error('音・接近トリガーの設定範囲を確認してください。');}}
export class TriggerDetector{
 constructor(){this.states=new Map();}
 reset(){this.states.clear();}
 forget(id){for(const kind of ['sound','near'])this.states.delete(id+':'+kind);}
 update(id,kind,settings,{value,eligible=true,suppressed=false,now}){
  if(!settings?.enabled||!eligible||!Number.isFinite(value)||!Number.isFinite(now)){this.states.delete(id+':'+kind);return false;}
  const key=id+':'+kind;let s=this.states.get(key);if(!s){s={armed:true,since:null,last:-Infinity};this.states.set(key,s);}
  if(suppressed){s.armed=false;s.since=null;return false;}
  const threshold=kind==='sound'?settings.threshold:settings.distance;
  const released=kind==='sound'?value<threshold*.65:value>threshold*1.2;
  if(released){s.armed=true;s.since=null;return false;}
  const hit=kind==='sound'?value>=threshold:value<=threshold;
  if(!hit||!s.armed){s.since=null;return false;}
  s.since??=now;
  if(now-s.since<(kind==='near'?.2:.04)||now-s.last<settings.cooldown)return false;
  s.armed=false;s.since=null;s.last=now;return true;
 }
}
export function rms(samples){if(!samples.length)return 0;let sum=0;for(const n of samples)sum+=n*n;return Math.min(1,Math.sqrt(sum/samples.length));}
/** Local-only analysis; not connected to the speakers, not recorded or uploaded. */
export class MicrophoneLevel{
 constructor({getStream,createContext}={}){this.getStream=getStream||(()=>{if(!globalThis.navigator?.mediaDevices?.getUserMedia)throw Error('マイクはHTTPSまたはlocalhostで利用してください。');return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false},video:false});});this.createContext=createContext||(()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)throw Error('音量検出に対応していません。');return new C();});this.generation=0;this.context=null;this.stream=null;this.analyser=null;this.pending=false;}
 async start(){if(this.pending)return;if(this.stream?.getAudioTracks().some(t=>t.readyState==='live')){await this.context.resume();return;}if(this.stream)this.stop();const token=++this.generation;this.pending=true;let stream,context;try{context=this.createContext();this.context=context;const resumed=Promise.resolve(context.resume()).then(()=>null,e=>e);stream=await this.getStream();const resumeError=await resumed;if(resumeError)throw resumeError;if(token!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}this.stream=stream;this.source=context.createMediaStreamSource(stream);this.analyser=context.createAnalyser();this.analyser.fftSize=1024;this.source.connect(this.analyser);this.samples=new Float32Array(this.analyser.fftSize);}catch(e){stream?.getTracks().forEach(t=>t.stop());if(token===this.generation)this.stop();throw Error('マイクを開始できません：'+e.message);}finally{if(token===this.generation)this.pending=false;}}
 get enabled(){return!!this.stream&&this.stream.getAudioTracks().some(t=>t.readyState==='live')&&this.context?.state==='running';}
 read(){if(!this.enabled||!this.analyser)return 0;this.analyser.getFloatTimeDomainData(this.samples);return rms(this.samples);}
 stop(){this.generation++;this.pending=false;this.stream?.getTracks().forEach(t=>t.stop());this.source?.disconnect();const context=this.context;this.context=null;this.stream=null;this.analyser=null;this.source=null;context?.close().catch(()=>{});}
}
