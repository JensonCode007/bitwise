import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)

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

interface Room {
  users: Map<string, { id: string; name: string }>
  changes: FileChange[]
}

const rooms = new Map<string, Room>()

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

function computeLineChanges(oldContent: string, newContent: string): FileChange['lineChanges'] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const changes: FileChange['lineChanges'] = []

  const maxLen = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]

    if (oldLine === undefined && newLine !== undefined) {
      changes.push({ line: i + 1, type: 'add', content: newLine })
    } else if (oldLine !== undefined && newLine === undefined) {
      changes.push({ line: i + 1, type: 'remove', content: oldLine })
    } else if (oldLine !== newLine) {
      changes.push({ line: i + 1, type: 'modify', content: newLine || '' })
    }
  }

  return changes
}

io.on('connection', (socket) => {
  console.log(`New User connected: ${socket.id}`)

  socket.on('join-room', ({ roomId, userName }: { roomId: string; userName: string }) => {
    socket.join(roomId)

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Map(),
        changes: []
      })
    }

    const room = rooms.get(roomId)!
    room.users.set(socket.id, { id: socket.id, name: userName })

    socket.to(roomId).emit('user-joined', { userId: socket.id, userName })
    socket.emit('room-users', Array.from(room.users.values()))
  })

  socket.on(
    'code-change',
    ({
      roomId,
      filePath,
      newCode,
      oldCode,
      userName
    }: {
      roomId: string
      filePath: string
      newCode: string
      oldCode: string
      userName: string
    }) => {
      if (!rooms.has(roomId)) return

      const room = rooms.get(roomId)!
      const lineChanges = computeLineChanges(oldCode || '', newCode)

      const change: FileChange = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        filePath,
        userId: socket.id,
        userName: userName || 'Anonymous',
        timestamp: Date.now(),
        oldContent: oldCode || '',
        newContent: newCode,
        lineChanges
      }

      room.changes.push(change)

      // Keep only last 50 changes per file
      const fileChanges = room.changes.filter((c) => c.filePath === filePath)
      if (fileChanges.length > 50) {
        const oldestId = fileChanges[0].id
        const idx = room.changes.findIndex((c) => c.id === oldestId)
        if (idx !== -1) room.changes.splice(idx, 1)
      }

      socket.to(roomId).emit('code-update', { filePath, code: newCode })
      socket.to(roomId).emit('change-made', change)
    }
  )

  socket.on('get-changes', ({ roomId, filePath }: { roomId: string; filePath: string }) => {
    if (!rooms.has(roomId)) {
      socket.emit('file-changes', { filePath, changes: [] })
      return
    }

    const room = rooms.get(roomId)!
    const fileChanges = room.changes.filter((c) => c.filePath === filePath).slice(-20) // Last 20 changes

    socket.emit('file-changes', { filePath, changes: fileChanges })
  })

  socket.on('get-all-changes', ({ roomId }: { roomId: string }) => {
    if (!rooms.has(roomId)) {
      socket.emit('all-changes', { changes: [] })
      return
    }

    const room = rooms.get(roomId)!
    socket.emit('all-changes', { changes: room.changes.slice(-50) })
  })

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        const user = room.users.get(socket.id)!
        room.users.delete(socket.id)
        socket.to(roomId).emit('user-left', user)
      }
    })
    console.log(`User disconnected: ${socket.id}`)
  })
})

const PORT = 5000
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
