import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, access, readdir, rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('repository install backs up replaced source, keeps compiled old targets, and leaves git metadata intact', async () => {
  const parent = await mkdtemp(resolve(tmpdir(), 'webar-install-')); const destination = resolve(parent, 'webar-art');
  try {
    for (const dir of ['.git', 'src', 'tests', 'public/targets', 'public/scenes/user-project']) await mkdir(resolve(destination, dir), {recursive: true});
    await writeFile(resolve(destination, '.git/HEAD'), 'ref: refs/heads/main');
    await writeFile(resolve(destination, 'package.json'), '{"name":"webar-art","version":"0.1.0"}');
    await writeFile(resolve(destination, 'src/app.js'), 'old app');
    await writeFile(resolve(destination, 'tests/lifecycle.test.mjs'), 'old test');
    await writeFile(resolve(destination, 'public/targets/mk_1008.mind'), 'old compiled target');
    await writeFile(resolve(destination, 'public/scenes/user-project/scene.json'), 'user data');
    await writeFile(resolve(destination, '.env'), 'private config');
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/install-repo.mjs', import.meta.url)), destination], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(await readFile(resolve(destination, 'package.json'))).version, '0.5.2');
    assert.equal(await readFile(resolve(destination, 'public/targets/mk_1008.mind'), 'utf8'), 'old compiled target');
    assert.equal(await readFile(resolve(destination, '.git/HEAD'), 'utf8'), 'ref: refs/heads/main');
    await assert.rejects(access(resolve(destination, 'tests/lifecycle.test.mjs')));
    assert.equal(await readFile(resolve(destination, 'public/scenes/user-project/scene.json'), 'utf8'), 'user data');
    assert.equal(await readFile(resolve(destination, '.env'), 'utf8'), 'private config');
    await access(resolve(destination, 'public/scenes/demo-interactive/tap.wav'));
    const backups = await readdir(resolve(parent, 'webar-art-backups')); assert.equal(backups.length, 1);
    assert.equal(await readFile(resolve(parent, 'webar-art-backups', backups[0], 'src/app.js'), 'utf8'), 'old app');
  } finally { await rm(parent, {recursive: true, force: true}); }
});
