import {isFace,setExperienceMode,editingPlacement} from '../studio/face-policy.js';
import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
test('actual Studio entry reads fixed handler and retains selected mode through preview reset and save',async()=>{
 const html=await readFile(new URL('../studio.html',import.meta.url),'utf8');assert.match(html,/src="\.\/studio\/editor\.js"/);
 const source=await readFile(new URL('../studio/editor.js',import.meta.url),'utf8');const handler=source.match(/modeInput\.onchange=\(\)=>\{[^\n]+?\};/)[0];
 for(const [before,after] of [['marker','space'],['space','marker'],['marker','face'],['face','marker']]){let saved;const input={value:after},project={experienceMode:before,markers:[],scenes:[]},context={isFace,setExperienceMode,editingPlacement,refresh(){},resetEditorView(){},syncFields(){},markerId:null,modeInput:input,project,endPreview:()=>{input.value=project.experienceMode},saveDraft:()=>{saved=structuredClone(project)},status:()=>{}};vm.createContext(context);vm.runInContext(handler,context);input.onchange();assert.equal(project.experienceMode,after);assert.equal(input.value,after);assert.equal(saved.experienceMode,after);}
});
