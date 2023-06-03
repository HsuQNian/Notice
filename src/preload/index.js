import { contextBridge, ipcRenderer, clipboard } from 'electron'
const api = { ipcRenderer, clipboard }
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} 
else {
  window.api = api
}