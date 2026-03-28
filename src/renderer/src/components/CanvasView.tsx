import { MousePointer2, Pencil, Square, Circle, Minus, Type, Layers } from 'lucide-react';

export const CanvasView = () => {
  const tools = [
    { icon: MousePointer2, active: true },
    { icon: Pencil, active: false },
    { icon: Square, active: false },
    { icon: Circle, active: false },
    { icon: Minus, active: false },
    { icon: Type, active: false },
    { icon: Layers, active: false },
  ];

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
      <div className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      <div className="text-center space-y-4 z-10 transition-transform duration-500 group-hover:scale-105">
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-sm shadow-inner shadow-white/5">
          <Layers size={40} className="text-gray-500" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Whiteboard Canvas</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Design UI and convert it into code instantly</p>
        </div>
        <button className="bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-white px-6 py-2.5 rounded-full border border-white/10 transition-all active:scale-95">
          Initialize Canvas
        </button>
      </div>
    </div>
  );
};
