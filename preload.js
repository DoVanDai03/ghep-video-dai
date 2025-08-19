// 3. File: preload.js
// File này tạo một cầu nối an toàn giữa giao diện (renderer) và logic nền (main).

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  startProcessing: (options) => ipcRenderer.send('start-processing', options),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, value) => callback(value)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_event, value) => callback(value)),
  onProcessingDone: (callback) => ipcRenderer.on('processing-done', () => callback()),
});
