import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string
}

interface FileChange {
  id: string
  filePath: string
  userId: string
  userName: string
  timestamp: number
  oldContent: string
  newContent: string
  lineChanges: { line: number; type: 'add' | 'remove' | 'modify'; content: string }[]
}

let socket: any = null
let io: any = null
const SOCKET_URL = 'http://localhost:5002'

const loadSocketIO = async () => {
  if (io) return io
  const socketIO = await import('socket.io-client')
  io = socketIO.io
  return io
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
    connect: async (roomId: string, userName: string): Promise<void> => {
      try {
        const SocketIO = await loadSocketIO()

        if (socket) {
          socket.disconnect()
        }

        socket = SocketIO(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        })

        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('Socket connection timeout, but continuing...')
            resolve()
          }, 5000)

          socket.on('connect', () => {
            console.log('Socket connected:', socket.id)
            socket.emit('join-room', { roomId, userName })
          })

          socket.on('room-users', (users: any[]) => {
            console.log('Room users:', users)
            clearTimeout(timeout)
            resolve()
          })

          socket.on('connect_error', (err: Error) => {
            console.error('Socket connection error:', err.message)
            clearTimeout(timeout)
            resolve()
          })

          socket.on('error', (err: Error) => {
            console.error('Socket error:', err.message)
          })
        })
      } catch (error) {
        console.error('Failed to connect:', error)
      }
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
      if (socket && socket.connected) {
        socket.emit('code-change', { roomId, filePath, oldCode, newCode, userName })
      }
    },

    onCodeUpdate: (callback: (data: { filePath: string; code: string }) => void) => {
      if (socket) {
        socket.on('code-update', callback)
        return () => socket.off('code-update', callback)
      }
      return () => {}
    },

    getAllChanges: async (roomId: string): Promise<{ changes: FileChange[] }> => {
      return new Promise((resolve) => {
        if (!socket || !socket.connected) {
          resolve({ changes: [] })
          return
        }

        socket.emit('get-all-changes', { roomId })

        const timeout = setTimeout(() => {
          resolve({ changes: [] })
        }, 1000)

        socket.once('all-changes', (data: { changes: FileChange[] }) => {
          clearTimeout(timeout)
          resolve(data)
        })
      })
    },

    onUserJoined: (callback: (data: { userId: string; userName: string }) => void) => {
      if (socket) {
        socket.on('user-joined', callback)
        return () => socket.off('user-joined', callback)
      }
      return () => {}
    },

    onUserLeft: (callback: (user: { id: string; name: string }) => void) => {
      if (socket) {
        socket.on('user-left', callback)
        return () => socket.off('user-left', callback)
      }
      return () => {}
    },

    onChangeMade: (callback: (change: FileChange) => void) => {
      if (socket) {
        socket.on('change-made', callback)
        return () => socket.off('change-made', callback)
      }
      return () => {}
    },

    shareProject: (roomId: string, projectPath: string, fileTree: any[]) => {
      if (socket && socket.connected) {
        socket.emit('share-project', { roomId, projectPath, fileTree })
      }
    },

    onProjectShared: (callback: (data: { projectPath: string; fileTree: any[] }) => void) => {
      if (socket) {
        socket.on('project-shared', callback)
        return () => socket.off('project-shared', callback)
      }
      return () => {}
    },

    requestProject: (roomId: string) => {
      if (socket && socket.connected) {
        socket.emit('get-project', { roomId })
      }
    },

    sendChatMessage: (roomId: string, content: string) => {
      if (socket && socket.connected) {
        socket.emit('chat-message', { roomId, content })
      }
    },

    onChatMessage: (callback: (message: any) => void) => {
      if (socket) {
        socket.on('chat-message', callback)
        return () => socket.off('chat-message', callback)
      }
      return () => {}
    },

    onChatMessageSent: (callback: (message: any) => void) => {
      if (socket) {
        socket.on('chat-message-sent', callback)
        return () => socket.off('chat-message-sent', callback)
      }
      return () => {}
    },

    getChatHistory: (roomId: string): Promise<any[]> => {
      return new Promise((resolve) => {
        if (!socket || !socket.connected) {
          resolve([])
          return
        }
        socket.emit('get-chat-history', { roomId })
        const timeout = setTimeout(() => resolve([]), 1000)
        socket.once('chat-history', (data: { messages: any[] }) => {
          clearTimeout(timeout)
          resolve(data.messages || [])
        })
      })
    },

    assignFile: (
      roomId: string,
      filePath: string,
      assigneeId: string,
      assigneeName: string,
      message?: string
    ) => {
      if (socket && socket.connected) {
        socket.emit('assign-file', { roomId, filePath, assigneeId, assigneeName, message })
      }
    },

    onFileAssigned: (
      callback: (data: { filePath: string; assigneeId: string; assigneeName: string }) => void
    ) => {
      if (socket) {
        socket.on('file-assigned', callback)
        return () => socket.off('file-assigned', callback)
      }
      return () => {}
    },

    isConnected: (): boolean => {
      return socket && socket.connected
    }
  }
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
