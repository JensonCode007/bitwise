import { Share2 } from 'lucide-react'

interface ToolbarProps {
  onCollaborativeClick: () => void
  activeView: 'code' | 'canvas'
  onViewChange: (view: 'code' | 'canvas') => void
}

export const Toolbar = ({ onCollaborativeClick, activeView, onViewChange }: ToolbarProps) => {
  const menus = ['File', 'Edit', 'View', 'Go', 'Run', 'Terminal', 'Help']

  return (
    <div className="h-12 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-2 flex items-center justify-between mx-4 mt-4 shadow-xl relative">
      <div className="flex items-center space-x-4 ml-2">
        {menus.map((menu) => (
          <button
            key={menu}
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-white/5"
          >
            {menu}
          </button>
        ))}
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 bg-black/40 p-1 rounded-lg border border-[#2a2a2a]">
        <button
          onClick={() => onViewChange('code')}
          className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${
            activeView === 'code'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          Code Editor
        </button>
        <button
          onClick={() => onViewChange('canvas')}
          className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${
            activeView === 'canvas'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          Canvas View
        </button>
      </div>

      <button
        onClick={onCollaborativeClick}
        className="flex items-center space-x-2 bg-white text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
      >
        <Share2 size={14} />
        <span>Collaborative View</span>
      </button>
    </div>
  )
}
