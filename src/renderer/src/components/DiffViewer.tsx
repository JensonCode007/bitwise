import { useState, useEffect } from 'react'
import { X, Plus, Minus, RefreshCw, FileDiff, Clock, User } from 'lucide-react'

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

interface DiffViewerProps {
  onClose: () => void
  isOpen: boolean
  roomId?: string | null
}

export const DiffViewer = ({ onClose, isOpen, roomId }: DiffViewerProps) => {
  const [changes, setChanges] = useState<FileChange[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && roomId && window.api.collab) {
      setLoading(true)
      window.api.collab.getAllChanges(roomId).then((result: { changes: FileChange[] }) => {
        setChanges(result.changes || [])
        setLoading(false)
      })
    }
  }, [isOpen, roomId])

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getUniqueFiles = (): string[] => {
    const files = new Set(changes.map((c) => c.filePath))
    return Array.from(files)
  }

  const filteredChanges = selectedFile
    ? changes.filter((c) => c.filePath === selectedFile)
    : changes

  const fileChanges = filteredChanges.slice(-20)

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-white">Diff Viewer</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              if (roomId && window.api.collab) {
                setLoading(true)
                window.api.collab
                  .getAllChanges(roomId)
                  .then((result: { changes: FileChange[] }) => {
                    setChanges(result.changes || [])
                    setLoading(false)
                  })
              }
            }}
            className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500 hover:text-white"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors text-gray-500"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!roomId ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <p className="text-gray-500 text-sm">Join a collaborative room to see changes</p>
          </div>
        </div>
      ) : (
        <>
          {getUniqueFiles().length > 1 && (
            <div className="px-4 py-2 border-b border-[#2a2a2a]">
              <select
                value={selectedFile || ''}
                onChange={(e) => setSelectedFile(e.target.value || null)}
                className="w-full bg-[#1a1a1a] text-xs text-white border border-[#2a2a2a] rounded px-2 py-1 outline-none"
              >
                <option value="">All Files</option>
                {getUniqueFiles().map((file) => (
                  <option key={file} value={file}>
                    {file.split('/').pop()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Changes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {fileChanges.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                {loading ? 'Loading changes...' : 'No changes yet'}
              </div>
            ) : (
              fileChanges.map((change) => (
                <div
                  key={change.id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden"
                >
                  {/* Change Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#252525] border-b border-[#2a2a2a]">
                    <div className="flex items-center space-x-2">
                      <User size={12} className="text-gray-500" />
                      <span className="text-xs text-gray-300">{change.userName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={12} className="text-gray-500" />
                      <span className="text-xs text-gray-500">{formatTime(change.timestamp)}</span>
                    </div>
                  </div>

                  {/* File Name */}
                  <div className="px-3 py-2 border-b border-[#2a2a2a]">
                    <span className="text-xs text-blue-400">
                      {change.filePath.split('/').pop()}
                    </span>
                  </div>

                  {/* Line Changes */}
                  <div className="p-2 font-mono text-xs max-h-48 overflow-y-auto">
                    {change.lineChanges.slice(0, 30).map((lineChange, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start space-x-2 py-0.5 ${
                          lineChange.type === 'add'
                            ? 'bg-green-900/30 text-green-400'
                            : lineChange.type === 'remove'
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-yellow-900/30 text-yellow-400'
                        }`}
                      >
                        <span className="w-6 text-gray-500 flex-shrink-0">
                          {lineChange.type === 'add' ? (
                            <Plus size={12} />
                          ) : lineChange.type === 'remove' ? (
                            <Minus size={12} />
                          ) : (
                            <RefreshCw size={10} />
                          )}
                        </span>
                        <span className="w-8 text-gray-600 flex-shrink-0">{lineChange.line}</span>
                        <span className="truncate">{lineChange.content || '(empty line)'}</span>
                      </div>
                    ))}
                    {change.lineChanges.length > 30 && (
                      <div className="text-gray-500 text-center py-1">
                        ... and {change.lineChanges.length - 30} more changes
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
