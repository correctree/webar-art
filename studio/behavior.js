/** Deterministic scene/tap state, shared by editor preview and AR. */
export class Behavior {
 constructor(project, hooks={}){this.project=project;this.hooks=hooks;this.scene=null;this.elapsed=0;this.pending=null;this.running=false;this.states=new Map();}
 enter(id){const next=this.project.scenes.find(s=>s.id===id);if(!next)throw new Error('シーンがありません: '+id);this.hooks.leave?.();this.scene=next;this.elapsed=0;this.pending=null;this.states.clear();for(const o of next.objects)this.states.set(o.id,o.autoplay);this.hooks.enter?.(next);return next;}
 tap(id){if(!this.running)return false;const o=this.scene?.objects.find(o=>o.id===id);if(!o)return false;const i=o.interaction;let playing=this.states.get(id);if(i.action==='restart')playing=true;else if(i.action==='toggle')playing=!playing;this.states.set(id,playing);this.hooks.tap?.(o,playing);if(i.nextSceneId)this.pending={id:i.nextSceneId,at:this.elapsed+i.delay};return true;}
 update(dt){if(!this.running||!this.scene)return;this.elapsed+=Math.max(0,dt);if(this.pending&&this.elapsed>=this.pending.at)this.enter(this.pending.id);else if(!this.pending&&this.scene.autoNextSeconds>0&&this.elapsed>=this.scene.autoNextSeconds)this.enter(this.scene.nextSceneId);}
 stop(){this.running=false;this.pending=null;this.hooks.leave?.();}
}
