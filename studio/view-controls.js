// Camera-only operations. Marker plane is XY; its vertical axis is Z.
export const DEFAULT_VIEW=[0,-2.6,2.4];
export function rotateViewZ(position,target,radians){
 const [x,y,z]=position.map((v,i)=>v-target[i]);
 const c=Math.cos(radians),s=Math.sin(radians);
 return[target[0]+x*c-y*s,target[1]+x*s+y*c,target[2]+z];
}
export function setupMarkerOrbit(camera,orbit){
 camera.up.set(0,0,1);
 camera.position.set(...DEFAULT_VIEW);
 orbit.target.set(0,0,0);
 orbit.minAzimuthAngle=-Infinity;orbit.maxAzimuthAngle=Infinity;
 orbit.minPolarAngle=.01;orbit.maxPolarAngle=Math.PI-.01;
 orbit.update();
}
