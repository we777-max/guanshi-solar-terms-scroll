import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  ['three', 'build/three.module.js'],
  ['three', 'build/three.core.js'],
  ['three', 'examples/jsm/controls/OrbitControls.js'],
  ['three', 'examples/jsm/loaders/GLTFLoader.js'],
  ['three', 'examples/jsm/utils/BufferGeometryUtils.js'],
  ['three', 'LICENSE'],
  ['astronomy-engine', 'esm/astronomy.js']
];
for (const [pkg, name] of files) {
  const destination = path.join(root, 'vendor', pkg, name);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(root, 'node_modules', pkg, name), destination);
}
// This package includes its complete MIT notice in the JS header, not a LICENSE file.
const astronomySource = await readFile(path.join(root, 'node_modules/astronomy-engine/esm/astronomy.js'), 'utf8');
const astronomyNotice = astronomySource.slice(0, astronomySource.indexOf('*/') + 2);
await writeFile(path.join(root, 'vendor/astronomy-engine/LICENSE.txt'), astronomyNotice + '\n');
const versions = {};
for (const pkg of ['three', 'astronomy-engine']) {
  versions[pkg] = JSON.parse(await readFile(path.join(root, 'node_modules', pkg, 'package.json'), 'utf8')).version;
}
await writeFile(path.join(root, 'vendor/versions.json'), JSON.stringify(versions, null, 2) + '\n');
console.log('Vendored local runtime assets:', versions);
