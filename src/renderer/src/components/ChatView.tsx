import { useState } from 'react'
import { Send, X, Plus, MoreVertical } from 'lucide-react'

interface Message {
  id: string
  user: string
  content: string
  timestamp: Date
}

interface ChatViewProps {
  onClose: () => void
  isOpen: boolean
  onSetupCollab?: () => void
  isCollabSetup?: boolean
}

export const ChatView = ({
  onClose,
  isOpen,
  onSetupCollab,
  isCollabSetup = false
}: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const currentUser = 'You'

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      user: currentUser,
      content: input,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, newMessage])
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-white">Chat</span>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.user === currentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      message.user === currentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a]'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1 opacity-70">{message.user}</div>
                    <div>{message.content}</div>
                  </div>
                </div>
              ))
            )}
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
