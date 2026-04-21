const { app, BrowserWindow } = require('electron');
console.log('TEST: Electron imports work');
console.log('app:', typeof app);
console.log('BrowserWindow:', typeof BrowserWindow);
app.quit();
