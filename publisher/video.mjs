import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export function processCommand(command,args,{timeout=120000}={}){return new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});let out='',err='';const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('動画処理がタイムアウトしました。'));},timeout);child.stdout.on('data',d=>{if(out.length<1000000)out+=d;});child.stderr.on('data',d=>{err=(err+d).slice(-4000);});child.on('error',e=>{clearTimeout(timer);reject(new Error(command+'がありません。FFmpegを導入してください。'));});child.on('exit',code=>{clearTimeout(timer);code===0?resolve(out):reject(new Error('動画変換に失敗しました: '+err.slice(-800)));});});}
export async function convertVideo(bytes,extension){if(!['webm','mp4'].includes(extension))throw new Error('動画形式が不正です。');const dir=await mkdtemp(join(tmpdir(),'webar-video-'));try{const input=join(dir,'input.'+extension),output=join(dir,'output.mp4');await writeFile(input,bytes);
 const probe=JSON.parse(await processCommand('ffprobe',['-v','error','-show_streams','-show_format','-of','json',input]));const stream=probe.streams?.find(s=>s.codec_type==='video');const duration=Number(probe.format?.duration||stream?.duration);
 if(!stream||!Number.isFinite(duration)||duration<=0||duration>60)throw new Error('動画は60秒以内にしてください。');
 if(stream.width*stream.height>4096*2160)throw new Error('動画解像度が大きすぎます。');
 const alpha=String(stream.tags?.alpha_mode)==='1';const decoder=alpha?(stream.codec_name==='vp9'?'libvpx-vp9':stream.codec_name==='vp8'?'libvpx':null):null;if(alpha&&!decoder)throw new Error('透過動画はVP8/VP9 WebMに対応しています。');
 const args=['-hide_banner','-loglevel','error','-threads','2'];if(decoder)args.push('-c:v',decoder);args.push('-i',input);
 if(alpha){args.push('-filter_complex',"[0:v]fps=24,scale='min(960,iw)':-2,format=rgba,split[c][a];[a]alphaextract,format=rgb24[alpha];[c]format=rgb24[color];[color][alpha]hstack=inputs=2[out]",'-map','[out]');}
 else args.push('-vf',"fps=24,scale='min(960,iw)':-2");
 args.push('-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart','-y',output);await processCommand('ffmpeg',args);const result=await readFile(output);if(result.length>24*1024*1024)throw new Error('変換後動画が24MBを超えます。');return{content:result.toString('base64'),packedAlpha:alpha};
 }finally{await rm(dir,{recursive:true,force:true});}}
