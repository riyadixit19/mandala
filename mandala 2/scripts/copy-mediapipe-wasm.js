// Copies MediaPipe's WebAssembly runtime from the installed package into public/wasm,
// so the runtime always matches the @mediapipe/tasks-vision version in node_modules.
// A mismatch between the two is a common cause of "WASM" crashes during detection.
// Runs automatically after `npm install`.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const dest = path.join(__dirname, '..', 'public', 'wasm');

if (!fs.existsSync(src)) {
  console.warn('[mandala] @mediapipe/tasks-vision is not installed yet; keeping the existing public/wasm files.');
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
console.log(`[mandala] Copied MediaPipe runtime (${fs.readdirSync(src).length} files) to public/wasm`);
