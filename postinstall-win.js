/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

if (process.platform === 'win32') {
  const typeormPath = path.resolve('node_modules/typeorm');

  if (fs.existsSync(typeormPath)) {
    process.stdout.write('> Installing typeorm@0.3.11 for Windows\n');
    execSync('pnpm add typeorm@0.3.11', { stdio: 'inherit' });
  }
}
