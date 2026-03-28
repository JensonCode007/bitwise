import { useEffect, useRef, useState } from 'react'
import { Terminal as TerminalIcon, X } from 'lucide-react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

interface TerminalProps {
  onClose: () => void
  isOpen: boolean
  projectPath: string | null
}

const TERMINAL_ID = 'main-terminal'

export const Terminal = ({ onClose, isOpen, projectPath }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    if (!isOpen || !terminalRef.current) return

    const term = new XTerm({
      theme: {
        background: '#0d0d0d',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      cursorBlink: true,
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    window.api.terminal.create(TERMINAL_ID, projectPath || undefined)

    const unsubscribe = window.api.terminal.onData(TERMINAL_ID, (data) => {
      term.write(data)
    })

    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit()
        const { cols, rows } = xtermRef.current
        window.api.terminal.resize(TERMINAL_ID, cols, rows)
      }
    }

    window.addEventListener('resize', handleResize)
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(terminalRef.current)

    term.onData((data) => {
      window.api.terminal.write(TERMINAL_ID, data)
    })

    term.onKey(({ key }) => {
      if (key === '\r') {
        if (commandHistory.length > 0 || input.trim()) {
          setCommandHistory((prev) => [...prev, input])
          setHistoryIndex(-1)
        }
        setInput('')
      } else if (key === '\x7f') {
        setInput((prev) => prev.slice(0, -1))
      } else if (key === '\x1b[A') {
        if (commandHistory.length > 0) {
          const newIndex =
            historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
          setHistoryIndex(newIndex)
          setInput(commandHistory[newIndex] || '')
        }
      } else if (key === '\x1b[B') {
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1)
            setInput('')
          } else {
            setHistoryIndex(newIndex)
            setInput(commandHistory[newIndex] || '')
          }
        }
      }
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      window.api.terminal.destroy(TERMINAL_ID)
      unsubscribe()
      term.dispose()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && fitAddonRef.current && xtermRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit()
        const { cols, rows } = xtermRef.current!
        window.api.terminal.resize(TERMINAL_ID, cols, rows)
      }, 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="h-64 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl flex flex-col shadow-2xl transition-all duration-300 mx-4 mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a] bg-[#0d0d0d]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-white">
            <TerminalIcon size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Terminal</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors text-gray-500"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div ref={terminalRef} className="flex-1" />
    </div>
  )
}
