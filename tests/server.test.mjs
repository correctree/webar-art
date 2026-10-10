import test from 'node:test';
import assert from 'node:assert/strict';
import {server} from '../publisher/server.mjs';
test('public session response omits secrets; unauthenticated publication and cross-origin mutation are denied',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 try{const response=await fetch(base+'/api/session');const data=await response.json();assert.equal(data.authenticated,false);assert.equal(data.token,undefined);assert.equal(data.clientSecret,undefined);
 const noAuth=await fetch(base+'/api/publish',{method:'POST',headers:{Origin:'http://localhost:8080','Content-Type':'application/json'},body:'{}'});assert.equal(noAuth.status,401);
 const cross=await fetch(base+'/api/publish',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});assert.equal(cross.status,403);
 const crossDraft=await fetch(base+'/api/drafts/demo-interactive',{method:'PUT',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});assert.equal(crossDraft.status,403);
 const secret=await fetch(base+'/.env');assert.equal(secret.status,403);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
