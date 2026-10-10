/** Capture taps independently of camera/video/canvas stacking. No browser globals at import. */
export function installTapInput({surface,isActive,isUI,onTap,pointer=true}){
 let down=null;
 const start=e=>{if(!isActive()||isUI(e.target)||e.isPrimary===false||e.button>0)return;const p=e.changedTouches?.[0]||e;down={x:p.clientX,y:p.clientY,id:e.pointerId};};
 const end=e=>{const d=down;down=null;if(!d||!isActive()||isUI(e.target)||e.isPrimary===false||d.id!==e.pointerId)return;const p=e.changedTouches?.[0]||e;if(Math.hypot(p.clientX-d.x,p.clientY-d.y)>12)return;onTap(p.clientX,p.clientY);};
 const cancel=()=>down=null,types=pointer?['pointerdown','pointerup','pointercancel']:['touchstart','touchend','touchcancel'];
 const opts={capture:true,passive:true};const handlers=[start,end,cancel];types.forEach((t,i)=>surface.addEventListener(t,handlers[i],opts));
 return()=>types.forEach((t,i)=>surface.removeEventListener(t,handlers[i],opts));
}
export function screenPoint(x,y,rect){if(!(rect.width>0&&rect.height>0)||x<rect.left||x>rect.left+rect.width||y<rect.top||y>rect.top+rect.height)return null;return{x:(x-rect.left)/rect.width*2-1,y:1-(y-rect.top)/rect.height*2};}
export function chooseScreenObject(x,y,objects,padding=10){return objects.filter(o=>o.points.length&&o.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.z>=-1&&p.z<=1)).map(o=>{const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y);return{...o,left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),depth:o.points.reduce((s,p)=>s+p.z,0)/o.points.length};}).filter(o=>x>=o.left-padding&&x<=o.right+padding&&y>=o.top-padding&&y<=o.bottom+padding).sort((a,b)=>a.depth-b.depth)[0]?.id||null;}
