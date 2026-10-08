import {mkdir,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const x of ['index.html','prepare.html','print.html','src','public']) await cp(x,`dist/${x}`,{recursive:true});
console.log('Build passed: static site in dist/');