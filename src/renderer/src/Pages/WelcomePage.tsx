import { useState } from 'react'
import {
  FolderOpen,
  Plus,
  Settings,
  ChevronRight,
  TerminalSquare,
  UserPlus,
  X,
  Shield
} from 'lucide-react'

interface RecentProject {
  path: string
  name: string
  lastOpened: number
}

interface WelcomePageProps {
  onEnterIde: (projectPath?: string) => void
  recentProjects?: RecentProject[]
  onJoinSession?: (roomId: string, userName: string) => void
}

const WelcomePage: React.FC<WelcomePageProps> = ({
  onEnterIde,
  recentProjects = [],
  onJoinSession
}) => {
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')

  const handleOpenFolder = async () => {
    const folderPath = await window.api.dialog.openFolder()
    if (folderPath) {
      onEnterIde(folderPath)
    }
  }

  const handleNewProject = () => {
    onEnterIde()
  }

  const handleJoinSessionClick = () => {
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }
    setError('')
    onJoinSession?.(roomCode.trim().toUpperCase(), userName)
  }

  const formatTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-black text-neutral-200 p-4 md:p-6 font-sans flex flex-col gap-6 selection:bg-neutral-800">
      {/* Top Header Island */}
      <header className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#0a0a0a] p-4 px-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <TerminalSquare size={20} strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Bitwise</h1>
        </div>
        <button className="rounded-md p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Actions) - Spans 7 columns */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Start Island */}
          <div className="flex-1 rounded-2xl border border-neutral-800 bg-[#0a0a0a] p-8 shadow-2xl flex flex-col justify-center">
            <h2 className="text-2xl font-medium tracking-tight text-white mb-2">Welcome back</h2>
            <p className="text-neutral-400 pb-8">What would you like to build today?</p>

            <div className="grid gap-4">
              <button
                onClick={handleNewProject}
                className="group flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 hover:bg-white hover:text-black transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 bg-[#0a0a0a] group-hover:border-neutral-300 group-hover:bg-white transition-colors">
                    <Plus size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">New Project</h3>
                    <p className="text-sm text-neutral-500 group-hover:text-neutral-600">
                      Start from a blank canvas
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-neutral-500 group-hover:text-black" />
              </button>

              <button
                onClick={handleOpenFolder}
                className="group flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-[#0a0a0a]">
                    <FolderOpen size={20} className="text-neutral-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white">Open Folder</h3>
                    <p className="text-sm text-neutral-500">Open a local project directory</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowJoinModal(true)}
                className="group flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-[#0a0a0a]">
                    <UserPlus size={20} className="text-green-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white">Join Session</h3>
                    <p className="text-sm text-neutral-500">Join a collaborative session</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Recents) - Spans 5 columns */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex-1 rounded-2xl border border-neutral-800 bg-[#0a0a0a] p-8 shadow-2xl">
            <h2 className="text-xl font-medium tracking-tight text-white pb-5">Recent Projects</h2>
            <div className="flex flex-col gap-2">
              {recentProjects.length === 0 ? (
                <p className="text-sm text-neutral-500 py-4 text-center">No recent projects</p>
              ) : (
                recentProjects.map((project, i) => (
                  <button
                    key={i}
                    onClick={() => onEnterIde(project.path)}
                    className="group flex items-start justify-between rounded-lg p-3 hover:bg-neutral-900 transition-colors text-left border border-neutral-800"
                  >
                    <div className="flex gap-3">
                      <div>
                        <h4 className="font-medium text-neutral-300 group-hover:text-white transition-colors">
                          {project.name}
                        </h4>
                        <p className="text-xs text-neutral-600">{project.path}</p>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-600">
                      {formatTime(project.lastOpened)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Join Session Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
                    <UserPlus size={20} className="text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Join Session</h2>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Room Code</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    maxLength={6}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-green-500 transition-colors font-mono tracking-widest"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <div className="flex items-center gap-3 pt-2">
                  <Shield size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500">
                    You'll be connected to the collaborative session
                  </span>
                </div>

                <button
                  onClick={handleJoinSessionClick}
                  className="w-full bg-green-500 text-black font-bold py-4 rounded-xl hover:bg-green-400 transition-all shadow-lg"
                >
                  Join Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WelcomePage
