import { useState, useEffect, useRef } from 'react'
import { Send, X, Plus, MoreVertical } from 'lucide-react'

interface Message {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
}

interface ChatViewProps {
  onClose: () => void
  isOpen: boolean
  onSetupCollab?: () => void
  isCollabSetup?: boolean
  roomId?: string | null
  userName?: string
}

export const ChatView = ({
  onClose,
  isOpen,
  onSetupCollab,
  isCollabSetup = false,
  roomId,
  userName = 'You'
}: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isCollabSetup || !roomId || !window.api.collab) return

    window.api.collab.getChatHistory(roomId).then((history) => {
      setMessages(history || [])
    })

    const unsubscribeMsg = window.api.collab.onChatMessage((message) => {
      setMessages((prev) => [...prev, message])
    })

    const unsubscribeSent = window.api.collab.onChatMessageSent((message) => {
      setMessages((prev) => {
        if (!prev.find((m) => m.id === message.id)) {
          return [...prev, message]
        }
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

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-white">Chat</span>
          {roomId && <span className="text-xs text-green-500">•</span>}
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500">
            <MoreVertical size={14} />
          </button>
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
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
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

          {/* Input */}
          <div className="p-4 border-t border-[#2a2a2a]">
            <div className="flex items-center space-x-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] px-3 py-2">
              <button className="text-gray-500 hover:text-white transition-colors">
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
