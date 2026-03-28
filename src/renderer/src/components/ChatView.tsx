import { useState, useEffect, useRef } from 'react'
import { Send, X, Plus, MoreVertical, ChevronRight, ChevronLeft, User } from 'lucide-react'

interface Message {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
  isSystem?: boolean
}

interface RoomUser {
  id: string
  name: string
}

interface ChatViewProps {
  onClose: () => void
  isOpen: boolean
  onSetupCollab?: () => void
  isCollabSetup?: boolean
  roomId?: string | null
  userName?: string
  fileTree?: any[] // pass your flat/tree file list here
  roomUsers?: RoomUser[] // pass connected users here
}

type Step = 'idle' | 'pick-file' | 'pick-member'

export const ChatView = ({
  onClose,
  isOpen,
  onSetupCollab,
  isCollabSetup = false,
  roomId,
  userName = 'You',
  fileTree = [],
  roomUsers = []
}: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileSearch, setFileSearch] = useState('')
  const [assignMessage, setAssignMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isCollabSetup || !roomId || !window.api.collab) return

    window.api.collab.getChatHistory(roomId).then((history) => {
      setMessages(history || [])
    })

    const unsubscribeMsg = window.api.collab.onChatMessage((message: Message) => {
      console.log('Received chat message:', message)
      setMessages((prev) => [...prev, message])
    })

    const unsubscribeSent = window.api.collab.onChatMessageSent((message: Message) => {
      setMessages((prev) => {
        if (!prev.find((m) => m.id === message.id)) return [...prev, message]
        return prev
      })
    })

    return () => {
      unsubscribeMsg()
      unsubscribeSent()
    }
  }, [isCollabSetup, roomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // close assign flow when clicking outside — reset to idle
  useEffect(() => {
    if (step === 'idle') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetAssign()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step])

  const resetAssign = () => {
    setStep('idle')
    setSelectedFile(null)
    setFileSearch('')
    setAssignMessage('')
  }

  const handleSend = () => {
    if (!input.trim() || !roomId || !window.api.collab) return
    window.api.collab.sendChatMessage(roomId, input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAssignFile = (assigneeId: string, assigneeName: string) => {
    console.log('handleAssignFile called:', {
      selectedFile,
      roomId,
      assigneeId,
      assigneeName,
      assignMessage
    })
    if (!selectedFile || !roomId) {
      console.log('Missing selectedFile or roomId')
      alert('Missing selectedFile or roomId')
      return
    }
    if (!window.api.collab) {
      console.log('window.api.collab is undefined')
      alert('window.api.collab is undefined')
      return
    }
    if (!window.api.collab.isConnected()) {
      console.log('Socket not connected')
      alert('Socket not connected')
      return
    }
    console.log('Calling assignFile...')
    window.api.collab.assignFile(roomId, selectedFile, assigneeId, assigneeName, assignMessage)
    console.log('assignFile called, resetting...')
    resetAssign()
    alert('File assigned!')
  }

  const formatTime = (timestamp: number): string =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Flatten fileTree to a list of file paths (adjust to your actual tree shape)
  const flatFiles: string[] = flattenFileTree(fileTree)
  const filteredFiles = flatFiles.filter((f) => f.toLowerCase().includes(fileSearch.toLowerCase()))

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center space-x-2">
          {step !== 'idle' && (
            <button
              onClick={step === 'pick-member' ? () => setStep('pick-file') : resetAssign}
              className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500"
            >
              <ChevronLeft size={14} />
            </button>
          )}
          <span className="text-sm font-medium text-white">
            {step === 'idle'
              ? 'Chat'
              : step === 'pick-file'
                ? 'Assign — Pick File'
                : 'Assign — Pick Member'}
          </span>
          {roomId && step === 'idle' && <span className="text-xs text-green-500">•</span>}
        </div>
        <div className="flex items-center space-x-1">
          {step === 'idle' && (
            <button className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500">
              <MoreVertical size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors text-gray-500"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isCollabSetup ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-white font-medium mb-2">Collaborative Chat</h3>
          <p className="text-gray-500 text-sm pb-5">
            Set up collaborative view to chat with your team in real-time
          </p>
          <button
            onClick={onSetupCollab}
            className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            <span>Setup Collab View</span>
          </button>
        </div>
      ) : step === 'pick-file' ? (
        /* ── Step 1: pick a file ── */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <input
              autoFocus
              type="text"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {filteredFiles.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">No files found</p>
            ) : (
              filteredFiles.map((filePath) => {
                const name = filePath.split('/').pop() ?? filePath
                return (
                  <button
                    key={filePath}
                    onClick={() => {
                      setSelectedFile(filePath)
                      setStep('pick-member')
                    }}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#1a1a1a] group transition-colors"
                  >
                    <div>
                      <p className="text-sm text-white truncate">{name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{filePath}</p>
                    </div>
                    <ChevronRight size={13} className="text-gray-600 group-hover:text-gray-400" />
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : step === 'pick-member' ? (
        /* ── Step 2: pick a member ── */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a1a]">
            <p className="text-xs text-gray-500">Assigning</p>
            <p className="text-sm text-blue-400 font-medium truncate">
              {selectedFile?.split('/').pop()}
            </p>
          </div>
          <div className="px-3 py-2 border-b border-[#1a1a1a]">
            <input
              type="text"
              value={assignMessage}
              onChange={(e) => setAssignMessage(e.target.value)}
              placeholder="Add a message (optional)"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {roomUsers.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">No members connected</p>
            ) : (
              roomUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssignFile(user.id, user.name)}
                  className="w-full text-left flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <User size={13} className="text-blue-400" />
                  </div>
                  <span className="text-sm text-white">{user.name}</span>
                  {user.name === userName && (
                    <span className="text-[10px] text-gray-500 ml-auto">(you)</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                if (message.isSystem) {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <span className="text-[11px] text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 rounded-full">
                        {message.content}
                      </span>
                    </div>
                  )
                }

                const isCurrentUser = message.userName === userName
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a]'
                      }`}
                    >
                      {!isCurrentUser && (
                        <div className="text-xs font-medium mb-1 text-blue-400">
                          {message.userName}
                        </div>
                      )}
                      <div className="break-words">{message.content}</div>
                      <div
                        className={`text-[10px] mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-600'}`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ── */}
          <div className="p-4 border-t border-[#2a2a2a]">
            <div className="flex items-center space-x-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] px-3 py-2">
              <button
                onClick={() => setStep('pick-file')}
                title="Assign file"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function flattenFileTree(tree: any[], prefix = ''): string[] {
  const result: string[] = []
  for (const node of tree) {
    const fullPath = prefix ? `${prefix}/${node.name}` : node.name
    if (node.children && node.children.length > 0) {
      result.push(...flattenFileTree(node.children, fullPath))
    } else {
      result.push(fullPath)
    }
  }
  return result
}
