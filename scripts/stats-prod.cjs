const { spawnSync } = require('node:child_process');

// Capture JSON so the report prints as plain text rather than an escaped string.
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['convex', 'run', 'stats:summary', '--prod'],
  { encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 4 * 1024 * 1024 });
if (result.stderr) process.stderr.write(result.stderr);
if (result.error || result.status !== 0) {
  if (result.error) console.error(result.error.message);
  process.exit(result.status || 1);
}
try {
  const { report } = JSON.parse(result.stdout);
  if (typeof report !== 'string') throw new Error('Missing stats report');
  console.log(report);
} catch {
  console.error('Convex returned an unexpected report format.');
  process.exit(1);
}
