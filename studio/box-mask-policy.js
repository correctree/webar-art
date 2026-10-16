export function validateBoxMask(mask){
 if(mask===undefined)return;
 if(!mask||mask.type!=='box'||typeof mask.enabled!=='boolean'||!['inside','outside'].includes(mask.mode))throw new Error('箱型マスクの設定が不正です。');
 for(const key of ['position','rotation','size']){
  const a=mask[key];if(!Array.isArray(a)||a.length!==3||a.some(v=>!Number.isFinite(v)||Math.abs(v)>100||(key==='size'&&v<=0)))throw new Error('箱型マスクの位置・回転・サイズが不正です。');
 }
}
export function maskPointVisible(distances,mode='inside',epsilon=1e-6){
 const inside=distances.every(d=>d>=-epsilon);return mode==='outside'?!inside:inside;
}
