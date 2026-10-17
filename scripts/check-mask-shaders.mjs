import fs from 'node:fs';import vm from 'node:vm';
(async()=>{
 const source=fs.readFileSync(new URL('../studio/box-mask.js',import.meta.url),'utf8'),ctx={};vm.createContext(ctx);vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.install=installShapeShader;',ctx);
 const shaders=[];
 for(const packed of [false,true]){
  let vertexShader=packed?'varying vec2 vUv;void main(){vUv=position.xy+0.5;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;}':'void main(){vec3 transformed=position;\n#include <project_vertex>\n}';
  const fragmentShader=packed?'uniform sampler2D map;varying vec2 vUv;void main(){vec3 c=texture2D(map,vec2(vUv.x*.5,vUv.y)).rgb;float a=texture2D(map,vec2(.5+vUv.x*.5,vUv.y)).r;if(a<.015)discard;gl_FragColor=vec4(c,a);}':'void main(){gl_FragColor=vec4(1.0);}';
  const shader={uniforms:{},vertexShader,fragmentShader};const mat={};ctx.install(mat,{uniforms:{}});mat.onBeforeCompile(shader);
  shader.vertexShader='precision highp float;attribute vec3 position;uniform mat4 modelViewMatrix,projectionMatrix,modelMatrix;\n'+shader.vertexShader.replace('#include <project_vertex>','vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);gl_Position=projectionMatrix*mvPosition;');shader.fragmentShader='precision highp float;\n'+shader.fragmentShader;shaders.push(shader);
 }
 const output=process.argv[2]||'/tmp/ararart-mask-shaders.json';fs.writeFileSync(output,JSON.stringify(shaders));console.log(output);})();
