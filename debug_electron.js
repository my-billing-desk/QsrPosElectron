const electron = require('electron');
console.log('Electron value:', electron);
console.log('Electron stringified:', JSON.stringify(electron));
try {
    const { app } = require('electron');
    console.log('App is:', app);
} catch (e) {
    console.error(e);
}
