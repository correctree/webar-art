import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',publicDir:false,build:{outDir:'dist',emptyOutDir:false,target:'es2022',rollupOptions:{input:{studio:resolve('studio.html'),ar:resolve('ar.html')},external:id=>id==='three'||id.startsWith('three/addons/')}},worker:{format:'es'}});
