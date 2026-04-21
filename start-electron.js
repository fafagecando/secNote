const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Get electron binary path
const electronDistPath = path.join(__dirname, 'node_modules', 'electron', 'dist')
const isWindows = process.platform === 'win32'
const electronBin = path.join(electronDistPath, isWindows ? 'electron.exe' : 'electron')

if (!fs.existsSync(electronBin)) {
  console.error('Electron binary not found at:', electronBin)
  process.exit(1)
}

const child = spawn(electronBin, ['.'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    ELECTRON_RUN_AS_NODE: undefined,
  },
})

child.on('close', (code) => {
  process.exit(code)
})

child.on('error', (err) => {
  console.error('Failed to start Electron:', err.message)
  process.exit(1)
})
