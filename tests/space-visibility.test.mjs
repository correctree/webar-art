import test from 'node:test';import assert from 'node:assert/strict';
import {aimPoint,projectedCandidateCheck,pairDistances,pairDrift} from '../studio/space-policy.js';
test('aim remains above tall controls and below the top toggle in an iPhone viewport',()=>{
 const rect={top:0,height:740};const aim=aimPoint(rect,470,65);assert.ok(aim.y*740>81);assert.ok(aim.y*740<442);assert.equal(aim.x,.5);
 const p={x:2*aim.x-1,y:1-2*aim.y,z:.8};assert.equal(projectedCandidateCheck(p,aim),true);assert.equal(projectedCandidateCheck({x:.95,y:-.95,z:.8},aim),false);assert.equal(projectedCandidateCheck({...p,z:1.1},aim),false);
});
test('pair distance diagnostic distinguishes rigid group motion from independent artwork drift',()=>{
 const a=[{id:'glb',worldPosition:[0,0,0]},{id:'sprite',worldPosition:[1,0,0]},{id:'video',worldPosition:[0,2,0]}],base=pairDistances(a);
 const common=a.map(o=>({...o,worldPosition:o.worldPosition.map((v,i)=>v+[10,20,30][i])}));assert.equal(pairDrift(base,pairDistances(common)),0);common[1].worldPosition[0]+=.4;assert.ok(pairDrift(base,pairDistances(common))>.39);
});
