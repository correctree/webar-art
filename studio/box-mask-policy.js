export function validateBoxMask(mask){
 if(mask===undefined)return;
 if(!mask||!MASK_TYPES.includes(mask.type)||typeof mask.enabled!=='boolean'||!['inside','outside'].includes(mask.mode))throw new Error('マスクの設定が不正です。');
 if(mask.name!==undefined&&(typeof mask.name!=='string'||mask.name.length>100))throw new Error('マスク名が不正です。');
 if(mask.animation!==undefined){const a=mask.animation;if(!a||typeof a.enabled!=='boolean'||typeof a.loop!=='boolean'||typeof a.pingpong!=='boolean'||!Number.isFinite(a.duration)||a.duration<.1||a.duration>60)throw new Error('マスクのアニメーション設定が不正です。');for(const key of ['move','rotate','scale'])if(!Array.isArray(a[key])||a[key].length!==3||a[key].some(v=>!Number.isFinite(v)||Math.abs(v)>(key==='rotate'?3600:100)||(key==='scale'&&(v<.01||v>10))))throw new Error('マスクのアニメーション変形が不正です。');}
 for(const key of ['position','rotation','size']){
  const a=mask[key];if(!Array.isArray(a)||a.length!==3||a.some(v=>!Number.isFinite(v)||Math.abs(v)>100||(key==='size'&&v<=0)))throw new Error('マスクの位置・回転・サイズが不正です。');
 }
}
export function maskPointVisible(distances,mode='inside',epsilon=1e-6){
 const inside=distances.every(d=>d>=-epsilon);return mode==='outside'?!inside:inside;
}
export const MASK_TYPES=['box','ellipsoid','cylinder','circle','rectangle'];
export function defaultMaskAnimation(){return {enabled:false,duration:3,loop:true,pingpong:true,move:[.25,0,0],rotate:[0,0,0],scale:[1,1,1]};}
export function maskPose(mask,time=0){
 const a=mask.animation;if(!a?.enabled)return {position:[...mask.position],rotation:[...mask.rotation],size:[...mask.size]};
 let t=Math.max(0,time)/a.duration;if(a.loop)t%=a.pingpong?2:1;else t=Math.min(t,a.pingpong?2:1);if(a.pingpong)t=t<=1?t:2-t;
 return {position:mask.position.map((v,i)=>v+a.move[i]*t),rotation:mask.rotation.map((v,i)=>v+a.rotate[i]*t),size:mask.size.map((v,i)=>v*Math.pow(a.scale[i],t))};
}
export function normalizedMaskInside(type,p){
 if(type==='ellipsoid')return p.reduce((s,v)=>s+v*v,0)<=.25+1e-7;
 if(type==='cylinder'||type==='circle')return p[0]*p[0]+p[1]*p[1]<=.25+1e-7&&(type==='circle'||Math.abs(p[2])<=.5+1e-7);
 return p.every((v,i)=>type==='rectangle'&&i===2||Math.abs(v)<=.5+1e-7);
}
