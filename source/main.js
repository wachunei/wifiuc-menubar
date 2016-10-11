/* jshint esversion: 6 */
const electron = require('electron');
const {app} = electron;

// const {BrowserWindow} = electron;
const menubar = require('menubar');
const _ = require('underscore');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// let win;
//
// function createWindow() {
//   win = new BrowserWindow({width: 800, height: 600});
//   win.webContents.openDevTools();
//
//   win.on('closed', () => {
//     // Dereference the window object, usually you would store windows
//     // in an array if your app supports multi windows, this is the time
//     // when you should delete the corresponding element.
//     win = null;
//   });
// }
//
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (win === null) {
//     createWindow();
//   }
// });

// // app.on('ready', createWindow);
const currentDir = process.cwd();

let mbOpts = {
  index: `file://${__dirname}/app/views/index.html`,
  tooltip: 'Wifi UC',
  width: 300,
  maxWidth: 300,
  minWidth: 300,
  height: 200,
  minHeight: 200,
  maxHeight: 400,
  frame: false,
  title: 'Wifi UC',
  icon: process.platform === 'darwin' ?
    `${__dirname}/icons/icondarwin.png`
    : `${__dirname}/icons/icon.png`
};

if (process.platform === 'win32') {
  mbOpts = _.extend(mbOpts, {
    'window-position': 'center',
    frame: true,
    minimizable: false,
    maximizable: false
  });
}

let mb = menubar(mbOpts);

let shouldQuit = app.makeSingleInstance(function() {
  if (mb.window) {
    mb.showWindow();
  }

  return true;
});

if (shouldQuit) {
  app.quit();
}

mb.on('after-create-window', function() {
  // mb.window.setResizable(false);
  // mb.window.openDevTools();
});

mb.on('show', function() {

});

mb.on('after-show', function() {
  mb.window.webContents.send('after-show');
});

mb.on('ready', function ready() {
});
