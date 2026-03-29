import { useEffect, useRef, useState } from 'react'
import { MousePointer2, Pencil, Square, Circle, Minus, Type, Layers, Trash2, Download } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

const SHAPE_TOOLS   = ['Square', 'Circle', 'Minus']
const DRAWING_TOOLS = ['Pencil', 'Square', 'Circle', 'Minus']

export const CanvasView = ({ roomId = 'hackathon-room', userName = 'Dev' }) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const gridRef        = useRef<HTMLDivElement>(null)
  const socketRef      = useRef<Socket | null>(null)
  const drawingsRef    = useRef<any[]>([])
  
  const cameraRef      = useRef({ x: 0, y: 0, z: 1 })
  const pendingShapeRef= useRef<any>(null)
  
  const startPosRef    = useRef({ x: 0, y: 0 })
  const isDrawingRef   = useRef(false)
  const activeToolRef  = useRef('Pencil')
  const lastPosRef     = useRef({ x: 0, y: 0 })
  const clearSeqRef    = useRef(0)

  const [activeTool, setActiveTool] = useState('Pencil')
  
  // NEW: State to track the floating text input box
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null)

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

  const getWorldPos = (screenX: number, screenY: number) => {
    return {
      x: (screenX - cameraRef.current.x) / cameraRef.current.z,
      y: (screenY - cameraRef.current.y) / cameraRef.current.z
    }
  }

  const updateGrid = () => {
    if (!gridRef.current) return
    const { x, y, z } = cameraRef.current
    gridRef.current.style.backgroundPosition = `${x}px ${y}px`
    gridRef.current.style.backgroundSize = `${40 * z}px ${40 * z}px`
  }

  const applyDrawData = (ctx: CanvasRenderingContext2D, d: any) => {
    ctx.strokeStyle = 'white'
    ctx.fillStyle   = 'white'
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
    } else if (tool === 'Type') {
      // NEW: Handle drawing text onto the canvas!
      ctx.font = '24px sans-serif'
      ctx.textBaseline = 'top' // Render down from the click point
      ctx.fillText(d.text, d.x0, d.y0)
    }
  }

  const renderFrame = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    ctx.save()
    ctx.translate(cameraRef.current.x, cameraRef.current.y)
    ctx.scale(cameraRef.current.z, cameraRef.current.z)

    drawingsRef.current.forEach((d) => applyDrawData(ctx, d))

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

  // --- NEW: DOWNLOAD LOGIC ---
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a temporary canvas
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // Fill with a dark background so white ink is visible
    tempCtx.fillStyle = '#0f0f0f'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    
    // Draw the current viewport over the dark background
    tempCtx.drawImage(canvas, 0, 0)

    const dataUrl = tempCanvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `bitwise-whiteboard-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  // ---------------------------

  useEffect(() => {
    const socket = io('http://localhost:5002')
    socketRef.current = socket

    socket.emit('join-room', { roomId, userName })

    socket.on('load-canvas', ({ drawings, clearSeq }: { drawings: any[]; clearSeq: number }) => {
      clearSeqRef.current = clearSeq
      drawingsRef.current = drawings
      renderFrame()
    })

    socket.on('receive-draw', (drawData: any) => {
      if ((drawData.clearSeq ?? 0) < clearSeqRef.current) return
      drawingsRef.current.push(drawData)
      renderFrame()
    })

    socket.on('canvas-cleared', ({ clearSeq }: { clearSeq: number }) => {
      clearSeqRef.current = clearSeq
      drawingsRef.current = []
      pendingShapeRef.current = null
      renderFrame()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [roomId, userName])

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

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault() 
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      const newZ = Math.min(Math.max(cameraRef.current.z * zoomDelta, 0.1), 10) 
      
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

  // --- NEW: TEXT TOOL LOGIC ---
  const saveText = () => {
    if (textInput && textInput.text.trim()) {
      const drawData = {
        tool: 'Type',
        x0: textInput.x,
        y0: textInput.y,
        text: textInput.text,
        clearSeq: clearSeqRef.current // Ensure text respects clears!
      }
      drawingsRef.current.push(drawData)
      socketRef.current?.emit('draw-action', { roomId, drawData })
      renderFrame()
    }
    setTextInput(null)
  }
  // -----------------------------

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId) 
    
    const tool = activeToolRef.current
    const { offsetX, offsetY } = e.nativeEvent

    if (tool === 'Select') {
      lastPosRef.current = { x: offsetX, y: offsetY }
      return
    }

    // Handle Text Tool Click
    if (tool === 'Type') {
      if (textInput) saveText() // Save previous text if clicking elsewhere
      const worldPos = getWorldPos(offsetX, offsetY)
      setTextInput({ x: worldPos.x, y: worldPos.y, text: '' })
      return
    }

    if (!DRAWING_TOOLS.includes(tool)) return

    isDrawingRef.current  = true
    const worldPos = getWorldPos(offsetX, offsetY)
    lastPosRef.current    = worldPos
    startPosRef.current   = worldPos
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return

    const tool = activeToolRef.current
    const { offsetX, offsetY } = e.nativeEvent

    if (tool === 'Select') {
      cameraRef.current.x += (offsetX - lastPosRef.current.x)
      cameraRef.current.y += (offsetY - lastPosRef.current.y)
      lastPosRef.current = { x: offsetX, y: offsetY }
      updateGrid()
      renderFrame()
      return
    }

    const worldPos = getWorldPos(offsetX, offsetY)

    if (tool === 'Pencil') {
      const drawData = {
        tool: 'Pencil',
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: worldPos.x,
        y1: worldPos.y,
        clearSeq: clearSeqRef.current
      }
      drawingsRef.current.push(drawData)
      socketRef.current?.emit('draw-action', { roomId, drawData })
      lastPosRef.current = worldPos
      renderFrame()
    } else if (SHAPE_TOOLS.includes(tool)) {
      pendingShapeRef.current = { tool, x0: startPosRef.current.x, y0: startPosRef.current.y, x1: worldPos.x, y1: worldPos.y }
      renderFrame()
    }
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    const tool = activeToolRef.current

    if (SHAPE_TOOLS.includes(tool) && pendingShapeRef.current) {
      const drawData = { ...pendingShapeRef.current, clearSeq: clearSeqRef.current }
      drawingsRef.current.push(drawData)
      socketRef.current?.emit('draw-action', { roomId, drawData })
      pendingShapeRef.current = null
      renderFrame()
    }
  }

  return (
    <div className="flex-1 w-full h-full bg-island border border-border rounded-island shadow-2xl relative overflow-hidden flex items-center justify-center group">
      
      {/* Left Toolbar */}
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

      {/* Right Toolbar for Download */}
      <div className="absolute top-6 right-6 bg-black/60 border border-border backdrop-blur-xl p-1.5 rounded-2xl flex flex-col space-y-1 z-20 shadow-2xl">
        <button
          onClick={handleDownload}
          className="p-2.5 rounded-xl transition-all text-gray-400 hover:text-white hover:bg-white/5"
          title="Download Canvas"
        >
          <Download size={18} strokeWidth={2} />
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

      {/* Floating Text Input overlay */}
      {textInput && (
        <input
          autoFocus
          type="text"
          value={textInput.text}
          onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveText()
          }}
          onBlur={saveText} // Saves if the user clicks away
          className="absolute z-50 bg-transparent text-white outline-none placeholder-gray-400"
          placeholder="Type..."
          style={{
            // Maps the infinite world coordinates back to screen pixels perfectly!
            left: textInput.x * cameraRef.current.z + cameraRef.current.x,
            top: textInput.y * cameraRef.current.z + cameraRef.current.y,
            fontSize: `${24 * cameraRef.current.z}px`,
            borderBottom: '1px dashed #555'
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 z-10 touch-none"
        style={{ 
          cursor: activeTool === 'Select' 
            ? 'grab' 
            : (activeTool === 'Type' ? 'text' : (DRAWING_TOOLS.includes(activeTool) ? 'crosshair' : 'default')) 
        }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
      />
    </div>
  )
}