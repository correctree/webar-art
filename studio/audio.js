/** Web Audio for the PC editor; native media playback for AR touch gestures. */
export class AudioBank {
 constructor(resolve,{mode='web',createContext,createMedia,fetcher=(...args)=>globalThis.fetch(...args)}={}){this.resolve=resolve;this.mode=mode;this.createContext=createContext||(()=>{const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('音声再生に対応していません。');return new C();});this.createMedia=createMedia||(()=>document.createElement('audio'));this.fetcher=fetcher;this.context=null;this.buffers=new Map();this.players=new Map();this.sources=new Map();this.leases=new Map();this.enabled=true;}
 async load(sounds){if(!sounds.length)return;if(this.mode==='web')this.context ||=this.createContext();await Promise.all(sounds.map(async s=>{if(this.buffers.has(s.id))return;const url=this.resolve(s.src),r=await this.fetcher(url);if(!r.ok)throw new Error('音素材を取得できません: '+s.name);const bytes=await r.arrayBuffer();if(!bytes.byteLength)throw new Error('音素材が空です: '+s.name);this.buffers.set(s.id,this.mode==='media'?url:await this.context.decodeAudioData(bytes));}));}
 unlock(){if(this.mode==='media')return Promise.resolve();return this.context?.resume()||Promise.resolve();}
 prepare(objects){if(this.mode!=='media')return;for(const o of objects)if(o.interaction.soundId)this.player(o);}
 player(o){const sound=o.interaction.soundId,url=this.buffers.get(sound);if(!url)throw new Error('音素材が読み込まれていません。');let p=this.players.get(o.id);if(p?.sound!==sound){if(p){p.media.pause();p.media.removeAttribute('src');p.media.load();}const media=this.createMedia();media.preload='auto';media.playsInline=true;media.setAttribute('playsinline','');media.src=url;media.load();p={sound,media};this.players.set(o.id,p);}return p.media;}
 play(o){this.stop(o.id);const i=o.interaction;if(!this.enabled||!i.soundId)return Promise.resolve(false);const lease=Symbol();this.leases.set(o.id,lease);const current=()=>this.leases.get(o.id)===lease&&this.enabled;
  try{if(this.mode==='media'){const media=this.player(o);media.muted=false;media.loop=false;media.volume=i.volume;if(media.readyState>0)media.currentTime=0;const source={stop:()=>{media.pause();if(media.readyState>0)media.currentTime=0;}};this.sources.set(o.id,source);media.onended=()=>{if(this.sources.get(o.id)===source)this.sources.delete(o.id);};
    // Call play synchronously while the pointer/button gesture is still active.
    return Promise.resolve(media.play()).then(()=>current()).catch(e=>{if(!current())return false;this.stop(o.id);throw new Error('音声を開始できません: '+e.message+' 「音声をテスト」を押してください。');});}
   const buffer=this.buffers.get(i.soundId);if(!buffer)throw new Error('音素材が読み込まれていません。');
   return this.unlock().then(()=>{if(!current())return false;if(this.context.state!=='running')throw new Error('音声機能を再開できません。');const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.gain.value=i.volume;source.connect(gain).connect(this.context.destination);source.onended=()=>{if(this.sources.get(o.id)===source)this.sources.delete(o.id);};this.sources.set(o.id,source);source.start();return true;});
  }catch(e){this.stop(o.id);return Promise.reject(e);}
 }
 stop(id){this.leases.delete(id);const source=this.sources.get(id);if(source){this.sources.delete(id);source.stop();}}
 stopAll(){for(const id of new Set([...this.sources.keys(),...this.leases.keys()]))this.stop(id);}
 async dispose(){this.stopAll();for(const {media} of this.players.values()){media.pause();media.removeAttribute('src');media.load();}this.players.clear();this.buffers.clear();await this.context?.close();this.context=null;}
}
