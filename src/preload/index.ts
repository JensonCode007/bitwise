import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
const SOCKET_URL = 'http://localhost:5000'

interface FileChange {
  id: string
  filePath: string
  userId: string
  userName: string
  timestamp: number
  oldContent: string
  newContent: string
}

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
  },
  collab: {
    connect: (roomId: string, userName: string) => {
      if (socket) {
        socket.disconnect()
      }
      socket = io(SOCKET_URL)

      return new Promise<void>((resolve) => {
        socket?.emit('join-room', { roomId, userName })
        socket?.on('room-users', () => {
          resolve()
        })
        // Timeout fallback
        setTimeout(resolve, 2000)
      })
    },

    disconnect: () => {
      if (socket) {
        socket.disconnect()
        socket = null
      }
    },

    sendCodeChange: (
      roomId: string,
      filePath: string,
      oldCode: string,
      newCode: string,
      userName: string
    ) => {
      socket?.emit('code-change', { roomId, filePath, oldCode, newCode, userName })
    },

    onCodeUpdate: (callback: (data: { filePath: string; code: string }) => void) => {
      socket?.on('code-update', callback)
      return () => socket?.off('code-update', callback)
    },

    getAllChanges: (roomId: string): Promise<{ changes: FileChange[] }> => {
      return new Promise((resolve) => {
        socket?.emit('get-all-changes', { roomId })
        socket?.once('all-changes', (data: { changes: FileChange[] }) => {
          resolve(data)
        })
        setTimeout(() => resolve({ changes: [] }), 1000)
      })
    },

    onUserJoined: (callback: (data: { userId: string; userName: string }) => void) => {
      socket?.on('user-joined', callback)
      return () => socket?.off('user-joined', callback)
    },

    onUserLeft: (callback: (user: { id: string; name: string }) => void) => {
      socket?.on('user-left', callback)
      return () => socket?.off('user-left', callback)
    }
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
