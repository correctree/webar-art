export class AudioBank {
 constructor(resolve){this.resolve=resolve;this.context=null;this.buffers=new Map();this.sources=new Map();this.enabled=true;}
 async load(sounds){if(!sounds.length)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('このブラウザーは音声再生に対応していません。');this.context ||=new C();await Promise.all(sounds.map(async s=>{const r=await fetch(this.resolve(s.src));if(!r.ok)throw new Error('音素材を取得できません: '+s.name);const b=await this.context.decodeAudioData(await r.arrayBuffer());this.buffers.set(s.id,b);}));}
 unlock(){return this.context?.resume()||Promise.resolve();}
 play(object){this.stop(object.id);const i=object.interaction;if(!this.enabled||!i.soundId)return;const b=this.buffers.get(i.soundId);if(!b||this.context.state!=='running')throw new Error('音声を有効にするには再生ボタンを押してください。');const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=b;gain.gain.value=i.volume;source.connect(gain).connect(this.context.destination);source.onended=()=>{if(this.sources.get(object.id)===source)this.sources.delete(object.id);};this.sources.set(object.id,source);source.start();}
 stop(id){const s=this.sources.get(id);if(s){s.stop();this.sources.delete(id);}}
 stopAll(){for(const id of [...this.sources.keys()])this.stop(id);}
 async dispose(){this.stopAll();this.buffers.clear();await this.context?.close();this.context=null;}
}
