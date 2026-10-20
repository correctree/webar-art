import {defaultSequence,defaultAction,actionCount,validateGroup,moveActionLayer,groupTrigger} from './action-sequence.js';
const openState=new WeakMap();
const labels={rotate:'回転',move:'移動',scale:'拡大・縮小（XYZ）',wait:'待つ',sound:'音',scene:'シーン切替',hide:'消える',show:'出現',camera:'カメラへ向きを追従',pause:'停止'};
function node(tag,text='',className=''){const n=document.createElement(tag);n.textContent=text;n.className=className;return n;}
export function renderActionLayers(rows,{object,project,locked=false,save=()=>{},status=()=>{}}){
 rows.replaceChildren();if(!object)return;const q=object.interaction.sequence||defaultSequence();
 let migrated=false;q.actions=q.actions.map((a,index)=>{if(a.type==='showMove'){const move={...a,type:'move'};delete move.fade;delete move.delay;delete move.trigger;a={type:'parallel',actions:[{type:'show',delay:a.delay??0,fade:a.fade??0},move],trigger:a.trigger};migrated=true;}if(a.trigger===undefined){a.trigger=groupTrigger(q.actions,index,object.interaction.startTrigger||'tap');migrated=true;}return a;});if(migrated&&object.interaction.sequence)save();
 rows.append(node('p','各ACTIONで開始条件を選択。前のACTION完了後＝連続再生、タップ＝その位置で待機、シーン開始＝開始イベントを記録して順番に実行。枠内は同時再生。','hint'));
 let dragging=null,target=null;const repaint=()=>renderActionLayers(rows,{object,project,locked,save,status});
 const commit=fn=>{try{fn();save();repaint();}catch(e){status(e.message);}};
 const bind=(el,fn)=>{el.dataset.actionDrop='true';el._actionDrop=fn;};
 const execute=(from,to)=>commit(()=>{q.actions=moveActionLayer(q.actions,from,to);});
 function handle(host,from,title){const h=node('span','⠿','action-drag-handle');h.setAttribute('role','button');h.setAttribute('aria-label',title+'をドラッグ');h.tabIndex=0;h.draggable=false;h.onpointerdown=e=>{if(locked||e.button!==0)return;e.preventDefault();e.stopPropagation();const x=e.clientX,y=e.clientY;let started=false;
 const find=ev=>{const el=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-action-drop]');return el&&rows.contains(el)?el:null;};
 const move=ev=>{if(!started&&Math.hypot(ev.clientX-x,ev.clientY-y)<6)return;started=true;dragging=from;ev.preventDefault();target?.classList.remove('action-drop');target=find(ev);target?.classList.add('action-drop');h.classList.add('action-dragging');};
 const clean=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);target?.classList.remove('action-drop');h.classList.remove('action-dragging');};
 const up=ev=>{clean();if(started)find(ev)?._actionDrop?.(from);dragging=null;};const cancel=()=>{clean();dragging=null;};document.addEventListener('pointermove',move,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);};host.append(h);}
 function button(host,text,fn){const b=node('button',text);b.type='button';b.disabled=locked;b.onclick=()=>commit(fn);host.append(b);}
 function gap(host,to,text){const g=node('div',text,'action-layer-gap');bind(g,from=>execute(from,to));host.append(g);}
 function join(from,index){if(from.group===null&&from.index===index)return;commit(()=>{const candidate=structuredClone(q.actions),a=candidate[index];if(a.type!=='parallel'){const child=structuredClone(a);delete child.trigger;candidate[index]={type:'parallel',trigger:a.trigger,actions:[child]};}q.actions=moveActionLayer(candidate,from,{group:index,index:candidate[index].actions.length});});}
 function selector(host,label,value,options,onChange){const l=node('label',label),input=node('select');for(const [v,text]of options){const o=node('option',text);o.value=v;input.append(o);}input.value=value;input.disabled=locked;input.onchange=()=>commit(()=>onChange(input.value));l.append(input);host.append(l);return input;}
 function layer(a,index,parent,host,rootIndex,isChild){
 const from={group:isChild?rootIndex:null,index:isChild?index:rootIndex},d=node('details','','action-layer action-card');d.open=openState.get(a)??false;d.ontoggle=()=>openState.set(a,d.open);const summary=node('summary','','action-layer-summary');handle(summary,from,labels[a.type]);summary.append(node('span',labels[a.type]));d.append(summary);
 bind(summary,source=>(source.group??source.index)===rootIndex?execute(source,from):join(source,rootIndex));
 const panel=node('div','','action-layer-settings');d.append(panel);
 function change(fn){const old=structuredClone(a);try{fn();if(isChild)validateGroup(q.actions[rootIndex]);save();}catch(e){for(const k of Object.keys(a))delete a[k];Object.assign(a,old);status(e.message);repaint();}}
 function number(label,value,min,max,step,fn){const l=node('label',label),n=node('input');n.type='number';Object.assign(n,{value,min,max,step,disabled:locked});n.onchange=()=>{const v=Number(n.value);if(!Number.isFinite(v)||v<min||v>max){n.value=value;status('値は'+min+'〜'+max+'です。');return;}change(()=>fn(v));};l.append(n);panel.append(l);}
 const select=(label,value,opts,fn)=>{const l=node('label',label),n=node('select');for(const [v,t]of opts){const o=node('option',t);o.value=v;n.append(o);}n.value=value;n.disabled=locked;n.onchange=()=>change(()=>fn(n.value));l.append(n);panel.append(l);};
 if(a.type==='move')a.offset.forEach((v,i)=>number('移動量 '+['X','Y','Z'][i],v,-100,100,.01,n=>a.offset[i]=n));
 if(a.type==='rotate'){select('回転軸',a.axis,[['x','X'],['y','Y'],['z','Z']],v=>a.axis=v);number('角度（度）',a.angle,-3600,3600,1,v=>a.angle=v);}
 if(a.type==='scale'){panel.append(node('p','1＝維持、2＝2倍、0.5＝半分。','hint'));button(panel,a.linked?'🔗 XYZ連動 ON':'⛓ XYZ連動 OFF',()=>a.linked=!a.linked);a.factors.forEach((v,i)=>number('倍率 '+['X','Y','Z'][i],v,.01,10,.1,n=>{if(a.linked){a.factors=[n,n,n];repaint();}else a.factors[i]=n;}));}
 if(['show','hide'].includes(a.type)){number('待ち時間（秒）',a.delay??0,0,60,.1,v=>a.delay=v);number('フェード時間（秒）',a.fade??0,0,60,.1,v=>a.fade=v);}
 if(['move','rotate','scale','wait','pause'].includes(a.type))number('所要時間（秒・往復時は片道）',a.duration,.1,60,.1,v=>a.duration=v);
 if(['move','rotate','scale'].includes(a.type)){number('繰り返し回数',a.repeat,1,20,1,v=>a.repeat=v);const l=node('label','往復して戻る'),n=node('input');n.type='checkbox';n.checked=a.pingpong;n.disabled=locked;n.onchange=()=>change(()=>a.pingpong=n.checked);l.append(n);panel.append(l);}
 if(a.type==='sound'){select('音',a.soundId||'',[['','選択'],...project.sounds.map(s=>[s.id,s.name])],v=>a.soundId=v||null);number('音量',a.volume,0,1,.1,v=>a.volume=v);}
 if(a.type==='scene')select('切替先',a.sceneId,project.scenes.map(s=>[s.id,s.name]),v=>a.sceneId=v);
 if(a.type==='camera')select('向きの追従',String(a.enabled),[['true','開始'],['false','解除']],v=>a.enabled=v==='true');
 const tools=node('div','','action-layer-tools');button(tools,'複製して次のACTIONへ',()=>{if(actionCount(q.actions)>=24)throw Error('24アクションまでです。');const clone=structuredClone(a);clone.trigger='previous';q.actions.splice(rootIndex+1,0,clone);});button(tools,'削除',()=>{parent.splice(index,1);if(isChild&&!parent.length)q.actions.splice(rootIndex,1);});panel.append(tools);host.append(d);
 }
 q.actions.forEach((entry,index)=>{
 gap(rows,{group:null,index},'ここへACTIONを移動');const g=node('section','','action-layer-group'),heading=node('div','','action-layer-group-heading');handle(heading,{group:null,index},'ACTION-'+(index+1));heading.append(node('strong','ACTION-'+String(index+1).padStart(2,'0')),node('small',entry.type==='parallel'?'同時再生':'1レイヤー'));g.append(heading);bind(heading,from=>join(from,index));bind(g,from=>join(from,index));
 selector(g,'トリガー',entry.trigger,[['previous',index===0?'前のACTION完了後（先頭なので開始時）':'前のACTION完了後'],['tap','タップ'],['scene','シーン開始']],v=>{entry.trigger=v;});
 const children=entry.type==='parallel'?entry.actions:[entry];children.forEach((a,i)=>{if(entry.type==='parallel')gap(g,{group:index,index:i},'ここへアクションを移動');layer(a,entry.type==='parallel'?i:index,entry.type==='parallel'?children:q.actions,g,index,entry.type==='parallel');});if(entry.type==='parallel')gap(g,{group:index,index:children.length},'同時再生に追加');
 const tools=node('div','','action-group-tools');button(tools,'ACTIONを複製',()=>{if(actionCount(q.actions)+actionCount([entry])>24)throw Error('24アクションまでです。');q.actions.splice(index+1,0,structuredClone(entry));});if(entry.type==='parallel'&&children.length>1)button(tools,'同時再生を解除',()=>{const split=children.map((c,i)=>({...c,trigger:i===0?entry.trigger:'previous'}));q.actions.splice(index,1,...split);});button(tools,'ACTIONを削除',()=>q.actions.splice(index,1));g.append(tools);rows.append(g);
 });gap(rows,{group:null,index:q.actions.length},'ここへACTIONを移動');
}
