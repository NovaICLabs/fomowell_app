const { execSync } = require('child_process');

const isWindows = process.platform === 'win32';

const env = { ...process.env, DFX_NETWORK: 'ic' };

if (isWindows) {
  // console.log(`DFX_NETWORK=${env.DFX_NETWORK}`);
  execSync('vite.cmd build --mode=production', { stdio: 'inherit', env });
} else {
  // console.log(`DFX_NETWORK=${env.DFX_NETWORK}`);
  execSync('vite build --mode=production', { stdio: 'inherit', env });
}
