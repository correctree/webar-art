const base=()=>({position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],visible:true,followCamera:false,alpha:1,paused:false});
const copy=p=>({position:[...p.position],rotation:[...p.rotation],scale:[...p.scale],visible:p.visible,followCamera:p.followCamera,alpha:p.alpha,paused:p.paused});
export function defaultSequence(){return{enabled:false,retrigger:'restart',finish:'keep',actions:[]};}
export function defaultAction(type){if(['hide','show'].includes(type))return{type,delay:0,fade:0};if(type==='mediaPlay')return{type,start:'restart',loop:false,wait:false,clip:'all'};if(type==='mediaPause')return{type};if(type==='pause')return{type,duration:1};if(type==='camera')return{type,enabled:true};if(type==='rotate')return{type,axis:'z',angle:90,duration:1,repeat:1,pingpong:false};if(type==='showMove')return{type,offset:[0,0,.25],duration:1,repeat:1,pingpong:false,delay:0,fade:1};if(type==='move')return{type,offset:[0,0,.25],duration:1,repeat:1,pingpong:false};if(type==='scale')return{type,factors:[1.5,1.5,1.5],linked:true,duration:1,repeat:1,pingpong:false};if(type==='wait')return{type,duration:1};if(type==='sound')return{type,soundId:null,volume:1};return{type:'scene',sceneId:null};}
function validateFlatSequence(s,sounds,scenes){if(s===undefined)return;if(!s||typeof s.enabled!=='boolean'||!['restart','ignore','stop'].includes(s.retrigger)||!['keep','reset'].includes(s.finish)||!Array.isArray(s.actions)||s.actions.length>24)throw Error('連続アクションの設定が不正です。');for(const [index,a] of s.actions.entries()){if(s.enabled&&a?.type==='scene'&&index!==s.actions.length-1)throw Error('シーン切替は最後に配置してください。');if(!a||!['rotate','move','showMove','scale','wait','sound','scene','hide','show','camera','pause','mediaPlay','mediaPause'].includes(a.type))throw Error('アクションの種類が不正です。');if(['rotate','move','showMove','scale','wait','pause'].includes(a.type)&&(!Number.isFinite(a.duration)||a.duration<.1||a.duration>60))throw Error('アクション時間は0.1〜60秒です。');if(['rotate','move','showMove','scale'].includes(a.type)&&(!Number.isInteger(a.repeat)||a.repeat<1||a.repeat>20||typeof a.pingpong!=='boolean'))throw Error('繰り返しは1〜20回です。');if(a.type==='rotate'&&(!['x','y','z'].includes(a.axis)||!Number.isFinite(a.angle)||Math.abs(a.angle)>3600))throw Error('回転軸・角度が不正です。');for(const [kind,key,low,high]of [['move','offset',-100,100],['scale','factors',.01,10]])if((a.type===kind||kind==='move'&&a.type==='showMove')&&(!Array.isArray(a[key])||a[key].length!==3||a[key].some(v=>!Number.isFinite(v)||v<low||v>high)))throw Error('移動量・倍率が不正です。');if(['hide','show','showMove'].includes(a.type))for(const key of ['delay','fade'])if(a[key]!==undefined&&(!Number.isFinite(a[key])||a[key]<0||a[key]>60))throw Error('表示の待ち時間・フェード時間は0〜60秒です。');if(a.type==='mediaPlay'&&(!['restart','resume'].includes(a.start)||typeof a.loop!=='boolean'||typeof a.wait!=='boolean'||a.loop&&a.wait||typeof a.clip!=='string'||a.clip.length>200))throw Error('素材再生の設定が不正です。ループでは完了待ちは選べません。');if(a.type==='camera'&&typeof a.enabled!=='boolean')throw Error('カメラ追従設定が不正です。');if(a.type==='scale'&&typeof a.linked!=='boolean')throw Error('サイズ連動設定が不正です。');if(a.type==='sound'&&(!Number.isFinite(a.volume)||a.volume<0||a.volume>1||s.enabled&&!sounds.has(a.soundId)))throw Error('アクションの音を選択してください。');if(s.enabled&&a.type==='scene'&&!scenes.has(a.sceneId))throw Error('アクションのシーンを選択してください。');}}
// Groups are flat parallel branches; each property has a single writer.
export function actionChannels(a){
 if(['mediaPlay','mediaPause'].includes(a.type))return ['materialPlayback'];
 if(a.type==='rotate')return ['rotation.'+a.axis];
 if(a.type==='camera')return ['followCamera','rotation.x','rotation.y','rotation.z'];
 if(a.type==='showMove')return ['position','alpha','visible'];
 return ({move:['position'],scale:['scale'],show:['alpha','visible'],hide:['alpha','visible'],sound:['sound'],wait:[]})[a.type]||[];
}
export function validateGroup(a,sounds=new Set(),scenes=new Set(),enabled=false){
 if(!a||a.type!=='parallel'||!Array.isArray(a.actions)||a.actions.length<1||a.actions.length>24)throw Error('ACTIONは1〜24アクションです。');
 const used=new Set();
 for(const child of a.actions){
  if(!child||!['move','rotate','scale','show','hide','wait','sound','camera','mediaPlay','mediaPause'].includes(child.type))throw Error('このアクションは同時再生グループに入れられません。');
  validateFlatSequence({...defaultSequence(),enabled,actions:[child]},sounds,scenes);
  for(const key of actionChannels(child)){if(used.has(key))throw Error('同じ値を変更するアクションは同時再生できません：'+key);used.add(key);}
 }
 return a;
}
export function validateSequence(s,sounds=new Set(),scenes=new Set()){
 if(s===undefined)return;
 validateFlatSequence(s&&{...s,actions:s.actions?.map(a=>a?.type==='parallel'?defaultAction('wait'):a)},sounds,scenes);
 let count=0;for(const [index,a] of s.actions.entries()){if(a.trigger!==undefined&&!['previous','tap','scene'].includes(a.trigger))throw Error('ACTIONトリガーが不正です。');if(a.type==='parallel'){validateGroup(a,sounds,scenes,s.enabled);count+=a.actions.length;}else count++;}
 if(count>24)throw Error('グループ内を含め24アクションまでです。');
}
export function startsWithAppearance(actions){const a=actions?.[0];return a?.type==='show'||a?.type==='showMove'||a?.type==='parallel'&&a.actions.some(c=>c.type==='show');}
export function actionCount(actions){return actions.reduce((n,a)=>n+(a.type==='parallel'?a.actions.length:1),0);}
export function groupActions(actions,indices){
 const chosen=[...new Set(indices)].sort((a,b)=>a-b);
 if(chosen.length<2||chosen.some(i=>!Number.isInteger(i)||i<0||i>=actions.length))throw Error('2つ以上のアクションを選択してください。');
 const group={type:'parallel',actions:chosen.map(i=>structuredClone(actions[i]))};validateGroup(group);
 return actions.flatMap((a,i)=>i===chosen[0]?[group]:chosen.includes(i)?[]:[a]);
}
function actionDuration(a){if(a.type==='mediaPlay')return a.wait?Infinity:0;if(a.type==='mediaPause')return 0;if(['sound','camera','scene'].includes(a.type))return 0;if(a.type==='show'||a.type==='hide')return(a.delay||0)+(a.fade||0);if(a.type==='parallel')return Math.max(...a.actions.map(actionDuration));return a.type==='showMove'?Math.max((a.delay||0)+(a.fade||0),a.duration*(a.repeat||1)*(a.pingpong?2:1)):a.duration*(a.repeat||1)*(a.pingpong?2:1);}
export class ActionSequence {
 constructor(spec,onEvent=()=>{},initial={}){this.groupTriggers=initial.groupTriggers===true;this.firstTrigger=initial.firstTrigger||'tap';this.gateIndex=-1;this.waitingFor=null;this.sceneSignaled=false;this.pendingTap=false;this.mediaTask=null;this.failed=false;this.spec=structuredClone(spec);this.base=()=>({...base(),visible:initial.visible!==false,alpha:initial.visible===false?0:1});this.onEvent=onEvent;this.pose=this.base();this.active=false;this.index=0;this.elapsed=0;this.start=null;this.branches=null;}
 tap(){if(this.active){if(this.spec.retrigger==='ignore')return false;if(this.spec.retrigger==='stop'){this.active=false;return true;}}this.mediaTask=null;this.failed=false;this.gateIndex=-1;this.waitingFor=null;this.pendingTap=false;this.pose=this.base();this.index=0;this.elapsed=0;this.start=null;this.branches=null;this.active=true;return true;}
 reset(){this.mediaTask=null;this.failed=false;this.gateIndex=-1;this.waitingFor=null;this.sceneSignaled=false;this.pendingTap=false;this.active=false;this.pose=this.base();}
 signal(kind='tap'){
 if(kind==='scene')this.sceneSignaled=true;
 if(this.active&&this.waitingFor===kind){this.pendingTap=kind==='tap';this.waitingFor=null;return true;}
 if(this.active&&kind==='scene')return true;
 if(!this.tap())return false;this.pendingTap=kind==='tap';return true;
 }
 update(dt){let remaining=Math.max(0,dt),guard=0;this.pausedDelta=0;
 while(this.active&&guard++<128){const a=this.spec.actions[this.index];if(!a){this.active=false;if(this.spec.finish==='reset')this.pose=this.base();break;}
 if(this.groupTriggers&&this.gateIndex!==this.index){const trigger=groupTrigger(this.spec.actions,this.index,this.firstTrigger);if(trigger==='scene'&&!this.sceneSignaled||trigger==='tap'&&!this.pendingTap){this.waitingFor=trigger;break;}this.pendingTap=false;this.waitingFor=null;this.gateIndex=this.index;}
 if(a.type==='mediaPlay'||a.type==='mediaPause'){
 if(!this.mediaTask)this.mediaTask=this.onEvent(a)||{done:true};
 if(this.mediaTask.failed){this.failed=true;this.active=false;break;}
 if(a.type==='mediaPlay'&&a.wait&&!this.mediaTask.done){remaining=0;break;}
 this.mediaTask=null;this.index++;continue;
 }
 if(a.type==='parallel'){
 this.start??=copy(this.pose);
 if(!this.branches)this.branches=a.actions.map(child=>{const runner=new ActionSequence({...defaultSequence(),actions:[child]},this.onEvent);runner.base=()=>{const pose=copy(this.start);if(child.type==='show'){pose.alpha=0;pose.visible=false;}return pose;};runner.tap();return runner;});
 const total=actionDuration(a),step=Math.min(remaining,Math.max(0,total-this.elapsed));this.elapsed+=step;remaining-=step;this.pose=copy(this.start);
 for(let i=0;i<this.branches.length;i++){const runner=this.branches[i];runner.update(step);for(const key of actionChannels(a.actions[i])){if(key.startsWith('rotation.')){const axis=['x','y','z'].indexOf(key.slice(9));this.pose.rotation[axis]=runner.pose.rotation[axis];}else if(!['sound','materialPlayback'].includes(key))this.pose[key]=Array.isArray(runner.pose[key])?[...runner.pose[key]]:runner.pose[key];}}
 if(this.branches.some(r=>r.failed)){this.failed=true;this.active=false;break;}
 if(Number.isFinite(total)?this.elapsed<total-1e-9:this.branches.some(r=>r.active))break;
 this.index++;this.elapsed=0;this.start=null;this.branches=null;continue;
 }
 if(['sound','scene','camera'].includes(a.type)){if(a.type==='camera')this.pose.followCamera=a.enabled;this.index++;if(a.type==='scene')this.active=false;this.onEvent(a);if(a.type==='scene')break;continue;}
 this.start??=copy(this.pose);const visibility=['hide','show'].includes(a.type),delay=a.delay??0,fade=a.fade??0,repetitions=a.repeat||1,cycle=a.duration*(a.pingpong?2:1),total=visibility?delay+fade:a.type==='showMove'?Math.max(delay+fade,cycle*repetitions):cycle*repetitions,step=Math.min(remaining,Math.max(0,total-this.elapsed));this.elapsed+=step;remaining-=step;if(a.type==='pause')this.pausedDelta+=step;const complete=this.elapsed>=total-1e-9;this.pose=copy(this.start);
 if(visibility){const target=a.type==='show'?1:0;if(this.elapsed>=delay){const t=fade===0?1:Math.min(1,(this.elapsed-delay)/fade);this.pose.alpha=this.start.alpha+(target-this.start.alpha)*t;this.pose.visible=this.pose.alpha>0||a.type==='show'&&t<1;}if(complete){this.pose.alpha=target;this.pose.visible=target>0;}}
 else{let progress;if(complete||this.elapsed>=cycle*repetitions)progress=a.pingpong?0:repetitions;else if(a.pingpong){const within=this.elapsed%cycle;progress=within<=a.duration?within/a.duration:2-within/a.duration;}else progress=this.elapsed/a.duration;
 if(['move','showMove'].includes(a.type))this.pose.position=this.start.position.map((v,i)=>v+a.offset[i]*progress);if(a.type==='rotate')this.pose.rotation[['x','y','z'].indexOf(a.axis)]+=a.angle*Math.PI/180*progress;if(a.type==='scale')this.pose.scale=this.start.scale.map((v,i)=>Math.min(100,Math.max(.001,v*Math.pow(a.factors[i],progress))));}
 if(a.type==='showMove'){const t=this.elapsed<delay?0:fade===0?1:Math.min(1,(this.elapsed-delay)/fade);this.pose.alpha=t;this.pose.visible=t>0;}
 if(!complete)break;this.index++;this.elapsed=0;this.start=null;this.branches=null;
 }
 this.pose.paused=this.active&&!this.waitingFor&&this.spec.actions[this.index]?.type==='pause';return copy(this.pose);}
}

export function groupTrigger(actions,index,fallback='tap'){const value=actions[index]?.trigger??(index===0?fallback:'previous');return index===0&&value==='previous'?'scene':value;}
export function usesTrigger(o,kind){const i=o.interaction||{};if(!i.sequence?.enabled)return kind===(i.startTrigger||'tap');return i.sequence.actions.some((a,index)=>groupTrigger(i.sequence.actions,index,i.startTrigger||'tap')===kind);}
export function startsHidden(o){const i=o.interaction||{},q=i.sequence;return !!q?.enabled&&groupTrigger(q.actions,0,i.startTrigger||'tap')==='scene'&&startsWithAppearance(q.actions);}
export function moveActionLayer(actions,from,to){
 const next=structuredClone(actions),at=g=>{if(g===null)return next;if(next[g]?.type!=='parallel')throw Error('ACTIONがありません。');return next[g].actions;};
 const src=at(from.group),dst=at(to.group),item=src[from.index];if(!item||!Number.isInteger(to.index)||to.index<0||to.index>dst.length)throw Error('移動位置が不正です。');
 if(from.group===null&&to.group===from.index)throw Error('自分自身には移動できません。');
 const index=src===dst&&from.index<to.index?to.index-1:to.index;
 if(to.group!==null&&item.type==='parallel'){src.splice(from.index,1);for(const child of item.actions)delete child.trigger;dst.splice(index,0,...item.actions);}else{src.splice(from.index,1);dst.splice(index,0,item);if(to.group!==null)delete item.trigger;}
 const result=next.filter(a=>a.type!=='parallel'||a.actions.length);validateSequence({...defaultSequence(),actions:result});if(result.some((a,i)=>a.type==='scene'&&i!==result.length-1))throw Error('シーン切替は最後に配置してください。');return result;
}
