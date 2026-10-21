// Material playback state is independent of the object's movement/fade timeline.
export function materialPlayback(item,action,{configure,sync,onError=()=>{}}){
 if(!['glb','video','sprite'].includes(item.spec.kind))throw Error('この作品には素材アニメーションがありません。');
 if(action.type==='mediaPause'){item.playing=false;Promise.resolve(sync(item)).catch(onError);return{done:true};}
 if(action.loop&&action.wait)throw Error('ループは再生完了を待てません。');
 if(item.spec.kind==='glb'&&!item.clips?.length)throw Error('GLBにアニメーションが含まれていません。');
 const selected=item.spec.kind==='glb'?item.clips.filter(c=>action.clip==='all'||c.name===action.clip):[];
 if(item.spec.kind==='glb'&&!selected.length)throw Error('GLBアニメーションが見つかりません：'+action.clip);
 if(item.spec.kind==='video'&&(!Number.isFinite(item.video?.duration)||item.video.duration<=0))throw Error('動画の長さを取得できません。');
 const task={failed:false,ready:false};
 item.mediaLoop=action.loop;
 if(item.mixer){
  const times=new Map(selected.map(c=>[c.name,item.mixer.clipAction(c).time]));
  configure(item,{...item.spec.interaction,clip:action.clip,loop:action.loop});
  for(const clip of selected){const a=item.mixer.clipAction(clip);if(action.start==='resume')a.time=times.get(clip.name)||0;a.paused=false;a.enabled=true;}
 }
 if(item.video){item.video.loop=action.loop;if(action.start==='restart')item.video.currentTime=0;}
 if(action.start==='restart')item.time=0;
 item.paused=false;item.playing=true;
 Object.defineProperty(task,'done',{get(){if(task.failed||!task.ready)return false;if(action.loop)return false;if(item.video)return item.video.ended===true;if(item.mixer)return selected.every(c=>item.mixer.clipAction(c).time>=c.duration-1e-7);return item.time>=item.spec.sprite.frames/item.spec.sprite.fps;}});
 Promise.resolve(sync(item)).then(()=>task.ready=true,e=>{task.failed=true;item.playing=false;onError(e);});
 return task;
}

export function materialControlled(spec){return !!spec.interaction?.sequence?.enabled&&spec.interaction.sequence.actions.flatMap(a=>a.type==='parallel'?a.actions:[a]).some(a=>['mediaPlay','mediaPause'].includes(a.type));}
export function materialStartsManually(spec){return !!spec.interaction?.sequence?.enabled&&spec.interaction.sequence.actions.flatMap(a=>a.type==='parallel'?a.actions:[a]).some(a=>a.type==='mediaPlay');}
