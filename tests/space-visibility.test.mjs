import test from 'node:test';import assert from 'node:assert/strict';
import {stablePlacement,aimLayout,aimPoint,projectedCandidateCheck,pairDistances,pairDrift} from '../studio/space-policy.js';
test('aim remains above tall controls and below the top toggle in an iPhone viewport',()=>{
 const rect={top:0,height:740};const aim=aimPoint(rect,470,65);assert.ok(aim.y*740>81);assert.ok(aim.y*740<442);assert.equal(aim.x,.5);
 const p={x:2*aim.x-1,y:1-2*aim.y,z:.8};assert.equal(projectedCandidateCheck(p,aim),true);assert.equal(projectedCandidateCheck({x:.95,y:-.95,z:.8},aim),false);assert.equal(projectedCandidateCheck({...p,z:1.1},aim),false);
});
test('pair distance diagnostic distinguishes rigid group motion from independent artwork drift',()=>{
 const a=[{id:'glb',worldPosition:[0,0,0]},{id:'sprite',worldPosition:[1,0,0]},{id:'video',worldPosition:[0,2,0]}],base=pairDistances(a);
 const common=a.map(o=>({...o,worldPosition:o.worldPosition.map((v,i)=>v+[10,20,30][i])}));assert.equal(pairDrift(base,pairDistances(common)),0);common[1].worldPosition[0]+=.4;assert.ok(pairDrift(base,pairDistances(common))>.39);
});

test('oversized engine canvas cannot move the visible aim off an iPhone screen',()=>{
 const viewport={left:0,top:0,width:390,height:740};
 for(const canvas of [viewport,{left:0,top:0,width:1170,height:2220},{left:-390,top:-740,width:1170,height:2220}]){
  const layout=aimLayout(viewport,canvas,viewport,470,65);
  assert.equal(layout.screen.x,195);assert.ok(layout.screen.y>81&&layout.screen.y<442);
  assert.ok(Math.abs(canvas.left+canvas.width*layout.aim.x-195)<1e-9);
  assert.ok(Math.abs(canvas.top+canvas.height*layout.aim.y-layout.screen.y)<1e-9);
 }
});

test('placement needs a dense continuous cluster and resets on jumps, gaps and type changes',()=>{
 let state,result;
 for(let time=0;time<=1500;time+=50){result=stablePlacement(state,[.005*Math.sin(time),0,-2],'FEATURE_POINT',time);state=result.state;if(time<1500)assert.equal(result.ready,false);}
 assert.equal(result.ready,true);
 const jump=stablePlacement(state,[.2,0,-2],'FEATURE_POINT',1550);assert.equal(jump.ready,false);assert.equal(jump.state.since,1550);
 assert.equal(stablePlacement(state,[0,0,-2],'FEATURE_POINT',2000).ready,false);
 assert.equal(stablePlacement(state,[0,0,-2],'DETECTED_SURFACE',1550).ready,false);
 let sparse=stablePlacement(null,[0,0,-2],'FEATURE_POINT',0);sparse=stablePlacement(sparse.state,[0,0,-2],'FEATURE_POINT',1500);assert.equal(sparse.ready,false);
});
