import {mkdir, cp, rm, readFile, writeFile, access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validTarget, targetName} from '../src/policy.js';

export async function build(root = fileURLToPath(new URL('..', import.meta.url))) {
  const at = file => resolve(root, file);
  for (const file of ['node_modules/three/build/three.module.js', 'node_modules/@8thwall/engine-binary/dist/xr.js']) {
    try { await access(at(file)); } catch { throw new Error('依存ファイルがありません。先に npm install を実行してください：' + file); }
  }
  let targetReady = false;
  try {
    const data = JSON.parse(await readFile(at('public/targets/target.json'), 'utf8'));
    if (!validTarget(data) || !targetName(data) || /^(https?:|\/)/.test(data.imagePath)) throw new Error('ターゲット形式・相対パスが不正です。');
    const asset = resolve(root, 'public/targets', data.imagePath);
    if (!asset.startsWith(at('public/targets') + '/')) throw new Error('ターゲットの画像が公開対象外です。');
    await access(asset); targetReady = true;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await rm(at('dist'), {recursive: true, force: true}); await mkdir(at('dist'), {recursive: true});
  for (const file of ['index.html', 'print.html', 'src', 'public']) await cp(at(file), at('dist/' + file), {recursive: true});
  await mkdir(at('dist/vendor/three'), {recursive: true});
  for (const file of ['build', 'examples/jsm', 'examples/jsm/libs/draco']) {
    const dest = file.endsWith('/draco') ? 'draco' : file;
    await cp(at('node_modules/three/' + file), at('dist/vendor/three/' + dest), {recursive: true});
  }
  await cp(at('node_modules/@8thwall/engine-binary/dist'), at('dist/external/xr'), {recursive: true});
  await mkdir(at('dist/licenses'), {recursive: true});
  await cp(at('node_modules/three/LICENSE'), at('dist/licenses/three.txt'));
  await cp(at('node_modules/@8thwall/engine-binary/LICENSE'), at('dist/licenses/8thwall-engine.txt'));
  await writeFile(at('dist/.nojekyll'), '');
  await writeFile(at('dist/build-info.json'), JSON.stringify({version: '0.2.0', targetReady, engine: '1.0.0', three: '0.160.1'}, null, 2));
  console.log(`Build passed: dist/ / 画像AR ${targetReady ? '準備済み' : '未準備（空間ARのみ。npm run target:prepare で準備）'}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build().catch(error => { console.error(error.message); process.exitCode = 1; });
