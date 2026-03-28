import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  terminal: {
    create: (id: string, cwd?: string) => ipcRenderer.send('terminal:create', id, cwd),
    write: (id: string, data: string) => ipcRenderer.send('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send('terminal:resize', id, cols, rows),
    destroy: (id: string) => ipcRenderer.send('terminal:destroy', id),
    onData: (id: string, callback: (data: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: string) => callback(data)
      ipcRenderer.on(`terminal:data:${id}`, listener)
      return () => ipcRenderer.removeListener(`terminal:data:${id}`, listener)
    }
  },
  dialog: {
    openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder')
  },
  fs: {
    readDirectory: (dirPath: string): Promise<FileEntry[]> =>
      ipcRenderer.invoke('fs:readDirectory', dirPath),
    readFile: (
      filePath: string
    ): Promise<{ success: boolean; content?: string; encoding?: string; error?: string }> =>
      ipcRenderer.invoke('fs:readFile', filePath)
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  }
}

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
