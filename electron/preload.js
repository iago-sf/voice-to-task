const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('__electron', {
  isDesktop: true,
  platform: process.platform,
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  launchTerminalAgent: (opts) => ipcRenderer.invoke('launch-terminal-agent', opts),
  testTerminalBinary: (binary) => ipcRenderer.invoke('test-terminal-binary', { binary }),
})
