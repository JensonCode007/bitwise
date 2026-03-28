/// <reference types="vite/client" />

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string
  children?: FileEntry[]
}

interface Window {
  api: {
    dialog: {
      openFolder: () => Promise<string | null>
    }
    fs: {
      readDirectory: (dirPath: string) => Promise<FileEntry[]>
      readFile: (
        filePath: string
      ) => Promise<{ success: boolean; content?: string; encoding?: string; error?: string }>
    }
    terminal: {
      create: (id: string, cwd?: string) => void
      write: (id: string, data: string) => void
      resize: (id: string, cols: number, rows: number) => void
      destroy: (id: string) => void
      onData: (id: string, callback: (data: string) => void) => () => void
    }
    shell: {
      openExternal: (url: string) => void
    }
  }
  electron: {
    process: {
      versions: NodeJS.ProcessVersions
    }
    ipcRenderer: {
      send: (channel: string, ...args: unknown[]) => void
      on: (channel: string, func: (...args: unknown[]) => void) => void
    }
  }
}
