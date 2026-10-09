import {readFile, writeFile, mkdir, cp, access} from 'node:fs/promises';
import {resolve, dirname, basename, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validTarget, targetName} from '../src/policy.js';

export async function importTarget(jsonFile, root = fileURLToPath(new URL('..', import.meta.url))) {
  const source = resolve(jsonFile); const data = JSON.parse(await readFile(source, 'utf8'));
  if (!validTarget(data) || !targetName(data)) throw new Error('8th Wall公式CLIが生成した名前付きターゲットJSONを指定してください。');
  if (/^https?:/i.test(data.imagePath)) throw new Error('ローカルの画像を参照するJSONを指定してください。');
  const candidates = [...new Set([
    resolve(dirname(source), data.imagePath), resolve(root, data.imagePath),
    resolve(dirname(source), basename(data.imagePath)),
  ])];
  let image;
  for (const candidate of candidates) { try { await access(candidate); image = candidate; break; } catch {} }
  if (!image) throw new Error('JSONからターゲット画像を見つけられません。生成された画像とJSONを一緒に置いてください。');
  const destination = resolve(root, 'public/targets'); await mkdir(destination, {recursive: true});
  const imageName = 'target-tracking' + (extname(image) || '.jpg');
  if (resolve(image) !== resolve(destination, imageName)) await cp(image, resolve(destination, imageName));
  data.imagePath = './' + imageName;
  // Runtime only needs the tracking image; CLI resources are retained in the generation folder.
  delete data.resources;
  await writeFile(resolve(destination, 'target.json'), JSON.stringify(data, null, 2));
  console.log(`画像AR準備済み：${targetName(data)} → public/targets/target.json`);
  return data;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('使い方：npm run target:import -- image-targets/名前.json'); process.exitCode = 1; }
  else importTarget(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
}
