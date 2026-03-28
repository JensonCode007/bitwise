import { useState } from 'react'
import { X, Copy, Check, Users, Shield, Zap } from 'lucide-react'

interface CollaborativeModalProps {
  onClose: () => void
  isOpen: boolean
}

export const CollaborativeModal = ({ onClose, isOpen }: CollaborativeModalProps) => {
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-island border border-border rounded-island overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/10">
                <Users size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">Collaboration</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {!roomCode ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center space-y-3">
                  <Shield size={24} className="text-blue-400" />
                  <span className="text-xs font-medium text-gray-400">
                    End-to-end encryption enabled
                  </span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center space-y-3">
                  <Zap size={24} className="text-yellow-400" />
                  <span className="text-xs font-medium text-gray-400">
                    Real-time sync performance
                  </span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Invite your team to collaborate on code and design in real-time. Share your
                  session with a unique room code.
                </p>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
              >
                Create Room
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Room Code Ready
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <div className="bg-black border-2 border-white/10 px-8 py-4 rounded-3xl">
                    <span className="text-4xl font-mono font-black tracking-[0.5em] text-white ml-[0.5em]">
                      {roomCode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center space-x-2 bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/15 transition-all border border-white/5"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={() => setRoomCode('')}
                  className="px-6 bg-white/5 text-gray-400 font-medium py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                >
                  Reset
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Waiting for peers to join...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
