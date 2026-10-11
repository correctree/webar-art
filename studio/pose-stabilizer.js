// Marker poses are in camera coordinates. Translation thresholds scale with marker width.
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const angle=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a.reduce((n,v,i)=>n+v*b[i],0))));
const clone=p=>({position:[...p.position],quaternion:[...p.quaternion],scale:[...p.scale]});
function valid(p){return p&&p.position?.length===3&&p.quaternion?.length===4&&p.scale?.length===3&&[...p.position,...p.quaternion,...p.scale].every(Number.isFinite)&&p.scale.every(v=>v>0)&&Math.abs(Math.hypot(...p.quaternion)-1)<.02;}
function similar(a,b,positionLimit=.4,rotationLimit=.7,scaleLimit=.3){const unit=Math.max(...b.scale);return distance(a.position,b.position)<=unit*positionLimit&&angle(a.quaternion,b.quaternion)<=rotationLimit&&a.scale.every((v,i)=>Math.abs(v/b.scale[i]-1)<=scaleLimit);}
function interpolate(a,b,t){const sign=a.quaternion.reduce((n,v,i)=>n+v*b.quaternion[i],0)<0?-1:1;const q=a.quaternion.map((v,i)=>v+(sign*b.quaternion[i]-v)*t),length=Math.hypot(...q);return{position:a.position.map((v,i)=>v+(b.position[i]-v)*t),scale:a.scale.map((v,i)=>v+(b.scale[i]-v)*t),quaternion:q.map(v=>v/length)};}
export class PoseStabilizer {
 constructor(mode='stable'){this.mode=mode;this.reset();}
 reset(){this.pose=null;this.acceptedRaw=null;this.candidate=null;this.since=0;this.last=0;this.lastAccepted=-Infinity;this.visible=false;}
 update(raw,now){const dt=Math.min(.1,Math.max(0,(now-this.last)/1000));this.last=now;
 if(!valid(raw)){if(now-this.lastAccepted>120){this.visible=false;this.pose=null;this.acceptedRaw=null;this.candidate=null;}return this.visible?clone(this.pose):null;}
 const reference=this.acceptedRaw;
 if(!reference||!similar(raw,reference)){if(!this.candidate||!similar(raw,this.candidate,.15,.25,.15)){this.candidate=clone(raw);this.since=now;}
 const wait=reference?120:70;if(now-this.since<wait){if(now-this.lastAccepted>250){this.visible=false;}return this.visible&&this.pose?clone(this.pose):null;}
 this.candidate=null;
 }else this.candidate=null;
 this.lastAccepted=now;this.acceptedRaw=clone(raw);
 if(!this.pose)this.pose=clone(raw);else{const rate=this.mode==='responsive'?32:18;this.pose=interpolate(this.pose,raw,1-Math.exp(-rate*dt));}
 this.visible=true;return clone(this.pose);
 }
}
