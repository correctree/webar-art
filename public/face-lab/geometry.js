// Orthographic image-space placement: units are source-video pixels.
export function facePlacement(points, width, height, anchor='nose') {
  const nose=points?.[1], left=points?.[234], right=points?.[454], top=points?.[10], chin=points?.[152];
  if(![nose,left,right,top,chin].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;
  const span=Math.hypot((right.x-left.x)*width,(right.y-left.y)*height);
  if(span<1)return null;
  const p=anchor==='head'?{x:top.x+(top.x-chin.x)*.22,y:top.y+(top.y-chin.y)*.22}:nose;
  return {x:(p.x-.5)*width,y:(.5-p.y)*height,span};
}
