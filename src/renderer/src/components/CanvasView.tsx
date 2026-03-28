import { useEffect, useRef, useState } from 'react'
import { MousePointer2, Pencil, Square, Circle, Minus, Type, Layers, Trash2 } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

const SHAPE_TOOLS   = ['Square', 'Circle', 'Minus']
const DRAWING_TOOLS = ['Pencil', 'Square', 'Circle', 'Minus']

export const CanvasView = ({ roomId = 'hackathon-room', userName = 'Dev' }) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const gridRef        = useRef<HTMLDivElement>(null) // NEW: To move the grid when panning
  const socketRef      = useRef<Socket | null>(null)
  const drawingsRef    = useRef<any[]>([])
  
  // NEW: The Infinite Canvas "Camera" (X, Y offset and Z for zoom)
  const cameraRef      = useRef({ x: 0, y: 0, z: 1 })
  const pendingShapeRef= useRef<any>(null) // Replaces snapshotRef to prevent clipping
  
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
    { icon: MousePointer2, name: 'Select' }, // We will use this to PAN the camera!
    { icon: Pencil,        name: 'Pencil' },
    { icon: Square,        name: 'Square' },
    { icon: Circle,        name: 'Circle' },
    { icon: Minus,         name: 'Minus'  },
    { icon: Type,          name: 'Type'   },
    { icon: Layers,        name: 'Layers' }
  ]

  // NEW: Convert Screen Pixels (Mouse) to World Coordinates (Infinite Space)
  const getWorldPos = (screenX: number, screenY: number) => {
    return {
      x: (screenX - cameraRef.current.x) / cameraRef.current.z,
      y: (screenY - cameraRef.current.y) / cameraRef.current.z
    }
  }

  // NEW: Update the visual grid background to match pan/zoom
  const updateGrid = () => {
    if (!gridRef.current) return
    const { x, y, z } = cameraRef.current
    gridRef.current.style.backgroundPosition = `${x}px ${y}px`
    gridRef.current.style.backgroundSize = `${40 * z}px ${40 * z}px`
  }

  // ─── Renderer — Now supports transformed context ──────────────────────────
  const applyDrawData = (ctx: CanvasRenderingContext2D, d: any) => {
    ctx.strokeStyle = 'white'
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    const tool = d.tool ?? 'Pencil'

    if (tool === 'Pencil' || tool === 'Minus') {
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
    }
  }

  // NEW: The Master Render Loop. Redraws everything from memory instantly.
  const renderFrame = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // 1. Clear physical screen
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    // 2. Apply Infinite Camera Transform
    ctx.save()
    ctx.translate(cameraRef.current.x, cameraRef.current.y)
    ctx.scale(cameraRef.current.z, cameraRef.current.z)

    // 3. Draw History
    drawingsRef.current.forEach((d) => applyDrawData(ctx, d))

    // 4. Draw shape currently being dragged (prevents clipping bugs!)
    if (pendingShapeRef.current) {
      applyDrawData(ctx, pendingShapeRef.current)
    }

    ctx.restore()
  }

  const handleClearCanvas = () => {
    drawingsRef.current = []
    pendingShapeRef.current = null
    renderFrame()
    socketRef.current?.emit('clear-canvas', { roomId })
  }

  // ─── Effect 1: Socket ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io('http://localhost:5002')
    socketRef.current = socket

    socket.emit('join-room', { roomId, userName })

    socket.on('load-canvas', (history: any[]) => {
      drawingsRef.current = history
      renderFrame()
    })

    socket.on('receive-draw', (drawData: any) => {
      drawingsRef.current.push(drawData)
      renderFrame()
    })

    socket.on('canvas-cleared', () => {
      drawingsRef.current = []
      pendingShapeRef.current = null
      renderFrame()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [roomId, userName])

  // ─── Effect 2: Canvas sizing & Mouse Wheel Zoom ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setSize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      renderFrame()
    }

    setSize()
    const observer = new ResizeObserver(setSize)
    observer.observe(canvas)

    // Handle Zooming via Mouse Wheel
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault() // Stop page from scrolling
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      const newZ = Math.min(Math.max(cameraRef.current.z * zoomDelta, 0.1), 10) // Clamp zoom
      
      // Math to zoom exactly where the mouse is pointing
      const mouseX = e.offsetX
      const mouseY = e.offsetY
      cameraRef.current.x = mouseX - (mouseX - cameraRef.current.x) * (newZ / cameraRef.current.z)
      cameraRef.current.y = mouseY - (mouseY - cameraRef.current.y) * (newZ / cameraRef.current.z)
      cameraRef.current.z = newZ
      
      updateGrid()
      renderFrame()
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      observer.disconnect()
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // ─── Pointer handlers ────────────────────────────────────────────────────────
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // MAGIC FIX: Bind the mouse to the canvas so it keeps drawing even outside the window!
    e.currentTarget.setPointerCapture(e.pointerId) 
    
    const tool = activeToolRef.current
    const { offsetX, offsetY } = e.nativeEvent
    isDrawingRef.current  = true

    if (tool === 'Select') {
      // Setup for panning
      lastPosRef.current = { x: offsetX, y: offsetY }
      return
    }

    if (!DRAWING_TOOLS.includes(tool)) return

    // Convert to infinite world coordinates before saving
    const worldPos = getWorldPos(offsetX, offsetY)
    lastPosRef.current    = worldPos
    startPosRef.current   = worldPos
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return

    const tool = activeToolRef.current
    const { offsetX, offsetY } = e.nativeEvent

    if (tool === 'Select') {
      // Pan the camera around!
      cameraRef.current.x += (offsetX - lastPosRef.current.x)
      cameraRef.current.y += (offsetY - lastPosRef.current.y)
      lastPosRef.current = { x: offsetX, y: offsetY }
      updateGrid()
      renderFrame()
      return
    }

    const worldPos = getWorldPos(offsetX, offsetY)

    if (tool === 'Pencil') {
      const drawData = { tool: 'Pencil', x0: lastPosRef.current.x, y0: lastPosRef.current.y, x1: worldPos.x, y1: worldPos.y }
      drawingsRef.current.push(drawData)
      socketRef.current?.emit('draw-action', { roomId, drawData })
      lastPosRef.current = worldPos
      renderFrame()
    } else if (SHAPE_TOOLS.includes(tool)) {
      // Save pending shape to memory so it doesn't clip, then render
      pendingShapeRef.current = { tool, x0: startPosRef.current.x, y0: startPosRef.current.y, x1: worldPos.x, y1: worldPos.y }
      renderFrame()
    }
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Release the mouse lock
    e.currentTarget.releasePointerCapture(e.pointerId)
    
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    const tool = activeToolRef.current

    // Finalize the shape
    if (SHAPE_TOOLS.includes(tool) && pendingShapeRef.current) {
      drawingsRef.current.push(pendingShapeRef.current)
      socketRef.current?.emit('draw-action', { roomId, drawData: pendingShapeRef.current })
      pendingShapeRef.current = null
      renderFrame()
    }
  }

  return (
    <div className="flex-1 w-full h-full bg-island border border-border rounded-island shadow-2xl relative overflow-hidden flex items-center justify-center group">
      
      {/* Toolbar */}
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
            title={tool.name}
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
        ref={gridRef}
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0px 0px'
        }}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 z-10 touch-none"
        style={{ cursor: activeTool === 'Select' ? 'grab' : (DRAWING_TOOLS.includes(activeTool) ? 'crosshair' : 'default') }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
      />
    </div>
  )
}