import {readFile, readdir, stat} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {validTarget, targetName} from '../src/policy.js';
import {importTarget} from './import-target.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const packageDir = resolve(root, 'node_modules/@8thwall/image-target-cli');
try {
  const pkg = JSON.parse(await readFile(resolve(packageDir, 'package.json'), 'utf8'));
  const bin = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin || {})[0];
  if (!bin) throw new Error('公式CLIが見つかりません。npm install を実行してください。');
  console.log('\n画像パス：public/targets/mk_1008.jpg\n平面（Planar）を選び、クロップはまず既定値で進めてください。\n出力フォルダ：image-targets / 名前：mk_1008\nCLI終了後、生成JSONを自動で取り込みます。\n');
  const child = spawn(process.execPath, [resolve(packageDir, bin)], {cwd: root, stdio: 'inherit'});
  const code = await new Promise((res, rej) => { child.on('exit', res); child.on('error', rej); });
  if (code !== 0) throw new Error('ターゲット生成が完了しませんでした。');
  const files = [];
  async function scan(dir) {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      if (entry.name.startsWith('.') || ['node_modules', 'dist', 'public'].includes(entry.name)) continue;
      const file = resolve(dir, entry.name);
      if (entry.isDirectory()) await scan(file);
      else if (entry.name.endsWith('.json')) {
        try { const data = JSON.parse(await readFile(file, 'utf8')); if (validTarget(data) && targetName(data)) files.push({file, time: (await stat(file)).mtimeMs}); } catch {}
      }
    }
  }
  await scan(root); files.sort((a, b) => b.time - a.time);
  if (!files.length) throw new Error('生成JSONが見つかりません。npm run target:import -- 生成JSONのパス を実行してください。');
  await importTarget(files[0].file, root);
} catch (error) { console.error(error.message); process.exitCode = 1; }
