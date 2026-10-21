export function reorderScene(project,fromId,toId,after=false){
 const from=project.scenes.findIndex(s=>s.id===fromId),to=project.scenes.findIndex(s=>s.id===toId);if(from<0||to<0)throw Error('シーンが見つかりません。');if(from===to)return;
 let index=to+(after?1:0);const [entry]=project.scenes.splice(from,1);if(from<index)index--;project.scenes.splice(index,0,entry);
}
export function renderSceneLayers(host,{project,selectedId,locked=false,select,change}){
 host.replaceChildren();
 for(const scene of project.scenes){const row=document.createElement('div');row.className='scene-layer'+(scene.id===selectedId?' selected':'');row.dataset.sceneId=scene.id;
 const handle=document.createElement('span');handle.className='scene-layer-handle';handle.textContent='⠿';handle.setAttribute('role','button');handle.setAttribute('aria-label',scene.name+'を並べ替え');
 handle.onpointerdown=e=>{if(locked||e.button!==0)return;e.preventDefault();e.stopPropagation();const x=e.clientX,y=e.clientY;let started=false,target=null;
 const find=ev=>{const n=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-scene-id]');return n&&host.contains(n)?n:null;};
 const move=ev=>{if(!started&&Math.hypot(ev.clientX-x,ev.clientY-y)<6)return;started=true;ev.preventDefault();target?.classList.remove('scene-drop');target=find(ev);target?.classList.add('scene-drop');};
 const clean=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);target?.classList.remove('scene-drop');};
 const up=ev=>{clean();const target=find(ev);if(started&&target){const rect=target.getBoundingClientRect();reorderScene(project,scene.id,target.dataset.sceneId,ev.clientY>rect.top+rect.height/2);change();}};const cancel=()=>clean();
 document.addEventListener('pointermove',move,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);};
 const button=document.createElement('button');button.type='button';button.className='scene-layer-name';button.textContent=scene.name;button.disabled=locked;button.setAttribute('aria-pressed',String(scene.id===selectedId));button.onclick=()=>select(scene.id);
 const info=document.createElement('small');info.textContent=(project.initialSceneId===scene.id?'開始 · ':'')+scene.objects.length+'作品';row.append(handle,button,info);host.append(row);
 }
}
