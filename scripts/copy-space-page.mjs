import {
  copyFileSync, existsSync, mkdirSync, readFileSync
} from 'node:fs';

if (!existsSync('dist/index.html')) {
  throw new Error('dist/index.html がありません。ビルド出力を確認してください。');
}

copyFileSync('public/space.html', 'dist/space.html');
if(existsSync('public/space-test.html'))copyFileSync('public/space-test.html','dist/space-test.html');

const model = 'dist/artworks/sample.glb';
if (!existsSync(model)) {
  const source = 'public/artworks/sample.glb';
  if (!existsSync(source)) {
    throw new Error('sample.glb がありません。');
  }
  mkdirSync('dist/artworks', {recursive: true});
  copyFileSync(source, model);
}

if (readFileSync(model).subarray(0, 4).toString() !== 'glTF') {
  throw new Error('sample.glb がGLB形式ではありません。');
}

console.log('公開ファイル確認OK: space.html / artworks/sample.glb');
