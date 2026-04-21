const { spawn } = require('child_process');
const path = require('path');
const electronPath = require('electron');

const args = process.argv.slice(2);
const child = spawn(electronPath, args, {
  stdio: 'inherit',
  windowsHide: false
});

child.on('close', (code) => {
  process.exit(code);
});
