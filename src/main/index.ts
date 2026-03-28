import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readdir, stat } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as pty from 'node-pty'
import icon from '../../resources/icon.png?asset'

const terminals: Map<string, pty.IPty> = new Map()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Terminal IPC handlers
  ipcMain.on('terminal:create', (event, id: string, cwd?: string) => {
    try {
      let shell: string
      if (process.platform === 'win32') {
        shell = 'powershell.exe'
      } else {
        shell = process.env.SHELL || '/bin/zsh'
        if (!shell.startsWith('/')) {
          shell = '/bin/zsh'
        }
      }

      const terminalCwd = cwd || process.env.HOME || process.cwd()

      const terminal = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: terminalCwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color'
        } as { [key: string]: string }
      })
      terminals.set(id, terminal)

      terminal.onData((data) => {
        event.sender.send(`terminal:data:${id}`, data)
      })

      terminal.onExit(({ exitCode }) => {
        console.log(`Terminal ${id} exited with code ${exitCode}`)
        terminals.delete(id)
        event.sender.send(`terminal:exit:${id}`, exitCode)
      })
    } catch (error) {
      console.error('Failed to create terminal:', error)
      event.sender.send(`terminal:error:${id}`, String(error))
    }
  })

  ipcMain.on('terminal:write', (_event, id: string, data: string) => {
    const terminal = terminals.get(id)
    if (terminal) {
      terminal.write(data)
    }
  })

  ipcMain.on('terminal:resize', (_event, id: string, cols: number, rows: number) => {
    const terminal = terminals.get(id)
    if (terminal) {
      terminal.resize(cols, rows)
    }
  })

  ipcMain.on('terminal:destroy', (_event, id: string) => {
    const terminal = terminals.get(id)
    if (terminal) {
      terminal.kill()
      terminals.delete(id)
    }
  })

  // File system IPC handlers
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle('fs:readDirectory', async (_event, dirPath: string) => {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true })
      const files = await Promise.all(
        entries
          .filter((entry) => !entry.name.startsWith('.'))
          .map(async (entry) => {
            const fullPath = join(dirPath, entry.name)
            const stats = await stat(fullPath)
            return {
              name: entry.name,
              path: fullPath,
              isDirectory: entry.isDirectory(),
              size: stats.size,
              modified: stats.mtime.toISOString()
            }
          })
      )
      return files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
    } catch (error) {
      console.error('Failed to read directory:', error)
      return []
    }
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      const { readFile } = await import('fs/promises')
      const content = await readFile(filePath)
      return { success: true, content: content.toString('base64'), encoding: 'base64' }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    await shell.openExternal(url)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
