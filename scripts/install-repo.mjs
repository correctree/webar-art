import {mkdir, cp, rm, stat, writeFile} from 'node:fs/promises';
import {resolve, dirname, basename} from 'node:path';
import {fileURLToPath} from 'node:url';
const source = fileURLToPath(new URL('..', import.meta.url));
const destination = resolve(process.argv[2] || '');
const replace = ['src', 'scripts', 'tests', 'package.json', 'package-lock.json', 'index.html', 'print.html', 'README.md', 'LICENSE-MIT', 'TEST_REPORT.md', '.github/workflows/pages.yml', 'studio', 'publisher', 'studio.html', 'ar.html', 'vite.studio.config.mjs', 'Dockerfile', '.dockerignore', '.env.example', 'render.yaml', 'README_SETUP_JA.md', 'APPLY.sh', 'public/scenes/demo', 'public/scenes/demo-interactive'];
const copy = ['src', 'scripts', 'tests', 'package.json', 'index.html', 'print.html', 'README.md', 'LICENSE-MIT', 'TEST_REPORT.md', 'docs', 'public/artworks/sample.glb', 'public/targets/mk_1008.jpg', '.github/workflows/pages.yml', 'studio', 'publisher', 'studio.html', 'ar.html', 'vite.studio.config.mjs', 'Dockerfile', '.dockerignore', '.env.example', 'render.yaml', 'README_SETUP_JA.md', 'APPLY.sh', 'public/scenes/demo', 'public/scenes/demo-interactive'];
try {
  if (!process.argv[2] || destination === source) throw new Error('使い方：npm run install:repo -- "$HOME/webar-art-0.1"');
  await stat(resolve(destination, '.git'));
  const existing = JSON.parse(await (await import('node:fs/promises')).readFile(resolve(destination, 'package.json'), 'utf8'));
  if (existing.name !== 'webar-art') throw new Error('指定先はwebar-artのリポジトリではありません。');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = resolve(dirname(destination), 'webar-art-backups', basename(destination) + '-' + stamp);
  await mkdir(backup, {recursive: true});
  for (const item of [...new Set([...replace, 'public', 'docs', '.gitignore'])]) {
    try { await stat(resolve(destination, item)); await cp(resolve(destination, item), resolve(backup, item), {recursive: true}); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const item of replace) await rm(resolve(destination, item), {recursive: true, force: true});
  for (const item of copy) {
    await mkdir(dirname(resolve(destination, item)), {recursive: true});
    await cp(resolve(source, item), resolve(destination, item), {recursive: true});
  }
  const fs = await import('node:fs/promises');
  let ignore = ''; try { ignore = await fs.readFile(resolve(destination, '.gitignore'), 'utf8'); } catch {}
  const additions = ['node_modules/', 'dist/', '.DS_Store', 'image-targets/', '.env', '.env.*', '!.env.example'].filter(line => !ignore.split('\n').includes(line));
  if (additions.length) await writeFile(resolve(destination, '.gitignore'), ignore + '\n' + additions.join('\n') + '\n');
  console.log(`0.4.3を導入しました：${destination}\n旧版バックアップ：${backup}\n次にリポジトリ内で npm install → npm test → npm run build を実行してください。`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
