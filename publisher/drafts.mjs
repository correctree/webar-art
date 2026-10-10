import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {validatePackage,sceneId} from '../studio/schema.js';
export class DraftStore {
 constructor(directory){this.directory=directory;}
 path(owner,id){if(!/^[a-z0-9-]{1,100}$/i.test(owner)||!sceneId(id))throw new Error('保存IDが不正です。');return join(this.directory,owner,id+'.json');}
 async save(owner,id,data){validatePackage(data.scene,data.files,{draft:true});if(data.scene.id!==id)throw new Error('保存IDが一致しません。');const file=this.path(owner,id),savedAt=new Date().toISOString();await mkdir(join(this.directory,owner),{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify({scene:data.scene,files:data.files,savedAt}),{mode:0o600});await rename(temp,file);return{savedAt};}
 async load(owner,id){return JSON.parse(await readFile(this.path(owner,id),'utf8'));}
}
