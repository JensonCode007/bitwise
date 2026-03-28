import { useEffect, useRef, useState } from 'react'
import { MousePointer2, Pencil, Square, Circle, Minus, Type, Layers, Trash2 } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

const SHAPE_TOOLS   = ['Square', 'Circle', 'Minus']
const DRAWING_TOOLS = ['Pencil', 'Square', 'Circle', 'Minus']

export const CanvasView = ({ roomId = 'hackathon-room', userName = 'Dev' }) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const socketRef      = useRef<Socket | null>(null)
  const drawingsRef    = useRef<any[]>([])
  const snapshotRef    = useRef<ImageData | null>(null)
  const startPosRef    = useRef({ x: 0, y: 0 })
  const isDrawingRef   = useRef(false)
  const activeToolRef  = useRef('Pencil')
  const lastPosRef     = useRef({ x: 0, y: 0 })

  const [activeTool, setActiveTool] = useState('Pencil')
  const setTool = (tool: string) => {
    setActiveTool(tool)
    activeToolRef.current = tool
  }

  const tools = [
    { icon: MousePointer2, name: 'Select' },
    { icon: Pencil,        name: 'Pencil' },
    { icon: Square,        name: 'Square' },
    { icon: Circle,        name: 'Circle' },
    { icon: Minus,         name: 'Minus'  },
    { icon: Type,          name: 'Type'   },
    { icon: Layers,        name: 'Layers' }
  ]

  // ─── Renderer — always reads ctx fresh, never stale ──────────────────────────
  const applyDrawData = (d: any) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = 'white'
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    const tool = d.tool ?? 'Pencil'

    if (tool === 'Pencil') {
      ctx.beginPath()
      ctx.moveTo(d.x0, d.y0)
      ctx.lineTo(d.x1, d.y1)
      ctx.stroke()
      ctx.closePath()
    } else if (tool === 'Square') {
      ctx.beginPath()
      ctx.strokeRect(d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0)
    } else if (tool === 'Circle') {
      const rx = Math.abs(d.x1 - d.x0) / 2
      const ry = Math.abs(d.y1 - d.y0) / 2
      const cx = (d.x0 + d.x1) / 2
      const cy = (d.y0 + d.y1) / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else if (tool === 'Minus') {
      ctx.beginPath()
      ctx.moveTo(d.x0, d.y0)
      ctx.lineTo(d.x1, d.y1)
      ctx.stroke()
      ctx.closePath()
    }
  }

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const redrawAll = () => drawingsRef.current.forEach((d) => applyDrawData(d))

  const handleClearCanvas = () => {
    drawingsRef.current = []
    clearLocalCanvas()
    socketRef.current?.emit('clear-canvas', { roomId })
  }

  // ─── Effect 1: Socket — independent of canvas readiness ──────────────────────
  useEffect(() => {
    const socket = io('http://localhost:5002')
    socketRef.current = socket

    socket.emit('join-room', { roomId, userName })

    socket.on('load-canvas', (history: any[]) => {
      drawingsRef.current = history
      setTimeout(() => history.forEach((d) => applyDrawData(d)), 50)
    })

    socket.on('receive-draw', (drawData: any) => {
      drawingsRef.current.push(drawData)
      applyDrawData(drawData)
    })

    socket.on('canvas-cleared', () => {
      drawingsRef.current = []
      clearLocalCanvas()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [roomId, userName])

  // ─── Effect 2: Canvas sizing + resize observer ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setSize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      redrawAll()
    }

    setSize()

    const observer = new ResizeObserver(setSize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // ─── Pointer handlers — all via refs, zero stale-closure risk ────────────────
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const tool = activeToolRef.current
    if (!DRAWING_TOOLS.includes(tool)) return

    const { offsetX, offsetY } = e.nativeEvent
    isDrawingRef.current  = true
    lastPosRef.current    = { x: offsetX, y: offsetY }
    startPosRef.current   = { x: offsetX, y: offsetY }

    if (SHAPE_TOOLS.includes(tool)) {
      const canvas = canvasRef.current
      const ctx    = canvas?.getContext('2d')
      if (canvas && ctx) {
        snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return

    const tool             = activeToolRef.current
    const { offsetX, offsetY } = e.nativeEvent
    const canvas           = canvasRef.current
    const ctx              = canvas?.getContext('2d')
    if (!ctx) return

    if (tool === 'Pencil') {
      const drawData = { tool: 'Pencil', x0: lastPosRef.current.x, y0: lastPosRef.current.y, x1: offsetX, y1: offsetY }
      applyDrawData(drawData)
      drawingsRef.current.push(drawData)
      socketRef.current?.emit('draw-action', { roomId, drawData })
      lastPosRef.current = { x: offsetX, y: offsetY }
    } else if (SHAPE_TOOLS.includes(tool)) {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0)
      applyDrawData({ tool, x0: startPosRef.current.x, y0: startPosRef.current.y, x1: offsetX, y1: offsetY })
    }
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>, finalize = true) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    const tool = activeToolRef.current

    if (SHAPE_TOOLS.includes(tool)) {
      if (finalize) {
        const { offsetX, offsetY } = e.nativeEvent
        const drawData = { tool, x0: startPosRef.current.x, y0: startPosRef.current.y, x1: offsetX, y1: offsetY }
        drawingsRef.current.push(drawData)
        socketRef.current?.emit('draw-action', { roomId, drawData })
      } else {
        const canvas = canvasRef.current
        const ctx    = canvas?.getContext('2d')
        if (ctx && snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0)
      }
      snapshotRef.current = null
    }
  }

  return (
    <div className="flex-1 w-full h-full bg-island border border-border rounded-island shadow-2xl relative overflow-hidden flex items-center justify-center group">
      <div className="absolute top-6 left-6 bg-black/60 border border-border backdrop-blur-xl p-1.5 rounded-2xl flex flex-col space-y-1 z-20 shadow-2xl">
        {tools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => setTool(tool.name)}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === tool.name
                ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tool.icon size={18} strokeWidth={activeTool === tool.name ? 2.5 : 2} />
          </button>
        ))}

        <div className="w-full h-px bg-border my-1 opacity-50" />

        <button
          onClick={handleClearCanvas}
          className="p-2.5 rounded-xl transition-all text-red-400 hover:text-white hover:bg-red-500/80"
          title="Clear Canvas"
        >
          <Trash2 size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 z-10 touch-none"
        style={{ cursor: DRAWING_TOOLS.includes(activeTool) ? 'crosshair' : 'default' }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={(e)  => stopDrawing(e, true)}
        onPointerOut={(e) => stopDrawing(e, false)}
      />
    </div>
  )
}