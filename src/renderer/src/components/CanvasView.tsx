import { MousePointer2, Pencil, Square, Circle, Minus, Type, Layers } from 'lucide-react'

export const CanvasView = () => {
  const tools = [
    { icon: MousePointer2, active: true },
    { icon: Pencil, active: false },
    { icon: Square, active: false },
    { icon: Circle, active: false },
    { icon: Minus, active: false },
    { icon: Type, active: false },
    { icon: Layers, active: false }
  ]

  return (
    <div className="flex-1 w-full h-full bg-island border border-border rounded-island shadow-2xl relative overflow-hidden flex items-center justify-center group">
      {/* Tool palette */}
      <div className="absolute top-6 left-6 bg-black/60 border border-border backdrop-blur-xl p-1.5 rounded-2xl flex flex-col space-y-1 z-20 shadow-2xl">
        {tools.map((tool, i) => (
          <button
            key={i}
            className={`p-2.5 rounded-xl transition-all ${
              tool.active
                ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tool.icon size={18} strokeWidth={tool.active ? 2.5 : 2} />
          </button>
        ))}
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  )
}
