import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {convertVideo,processCommand} from '../publisher/video.mjs';
const available=spawnSync('ffmpeg',['-version']).status===0&&spawnSync('ffprobe',['-version']).status===0;
test('VP9 alpha conversion retains packed color and alpha tracks in Safari-compatible H.264',{skip:!available},async()=>{
 const source=await readFile(new URL('../public/scenes/demo/sample.webm',import.meta.url));const result=await convertVideo(source,'webm');assert.equal(result.packedAlpha,true);
 const dir=await mkdtemp(join(tmpdir(),'webar-verify-'));try{const file=join(dir,'sample.mp4');await writeFile(file,Buffer.from(result.content,'base64'));const data=JSON.parse(await processCommand('ffprobe',['-v','error','-show_streams','-of','json',file]));assert.equal(data.streams[0].codec_name,'h264');assert.equal(data.streams[0].width,640);assert.equal(data.streams[0].height,180);assert.equal(data.streams[0].pix_fmt,'yuv420p');assert.equal(data.streams.length,1);
 await processCommand('ffmpeg',['-v','error','-i',file,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-y',join(dir,'frame.rgb')]);const bytes=await readFile(join(dir,'frame.rgb'));const red=(x,y)=>bytes[(y*640+x)*3];assert.ok(red(320+10,10)<20,'transparent alpha must remain dark');assert.ok(red(320+45,80)>150,'object alpha must remain light');
 }finally{await rm(dir,{recursive:true,force:true});}
});
