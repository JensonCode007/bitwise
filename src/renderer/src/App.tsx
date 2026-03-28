import { useState, useEffect } from 'react'
import WelcomePage from './Pages/WelcomePage'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { CodeEditor } from './components/CodeEditor'
import { CanvasView } from './components/CanvasView'
import { Terminal } from './components/Terminal'
import { CollaborativeModal } from './components/CollaborativeModal'

interface OpenFile {
  path: string
  name: string
}

export default function App() {
  const [showIDE, setShowIDE] = useState(false)
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [collaborativeModalOpen, setCollaborativeModalOpen] = useState(false)
  const [activeView, setActiveView] = useState<'code' | 'canvas'>('code')

  const activeFile = activeFileIndex >= 0 ? openFiles[activeFileIndex] : null

  const handleFileClick = (path: string, name: string) => {
    const existingIndex = openFiles.findIndex((f) => f.path === path)
    if (existingIndex >= 0) {
      setActiveFileIndex(existingIndex)
    } else {
      setOpenFiles([...openFiles, { path, name }])
      setActiveFileIndex(openFiles.length)
    }
  }

  const handleCloseFile = (index: number) => {
    const newFiles = openFiles.filter((_, i) => i !== index)
    setOpenFiles(newFiles)
    if (activeFileIndex >= newFiles.length) {
      setActiveFileIndex(newFiles.length - 1)
    } else if (index < activeFileIndex) {
      setActiveFileIndex(activeFileIndex - 1)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setTerminalOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleEnterIde = (path?: string) => {
    if (path) {
      setProjectPath(path)
    }
    setShowIDE(true)
  }

  if (!showIDE) {
    return <WelcomePage onEnterIde={handleEnterIde} />
  }

  return (
    <div className="w-full h-screen bg-black gap-4 p-4 flex flex-col overflow-hidden">
      <Toolbar
        onCollaborativeClick={() => setCollaborativeModalOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <div className="flex-1 flex mt-4 gap-4 overflow-hidden">
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
          projectPath={projectPath}
          onFileClick={handleFileClick}
        />

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {activeView === 'code' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {openFiles.length > 0 && (
                <div className="flex items-center bg-[#0d0d0d] border border-[#2a2a2a] rounded-t-xl border-b-0">
                  {openFiles.map((file, index) => (
                    <button
                      key={file.path}
                      onClick={() => setActiveFileIndex(index)}
                      className={`flex items-center space-x-2 px-4 py-2 text-xs border-r border-[#2a2a2a] transition-colors ${
                        index === activeFileIndex
                          ? 'bg-[#1a1a1a] text-white'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-[#151515]'
                      }`}
                    >
                      <span>{file.name}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCloseFile(index)
                        }}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                {activeFile ? (
                  <CodeEditor projectPath={projectPath} openFile={activeFile} />
                ) : (
                  <div className="flex-1 w-full h-full overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl flex items-center justify-center">
                    <p className="text-gray-500">Select a file from the sidebar to edit</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <CanvasView />
          )}
          <Terminal
            onClose={() => setTerminalOpen(false)}
            isOpen={terminalOpen}
            projectPath={projectPath}
          />
        </div>
      </div>

      <CollaborativeModal
        onClose={() => setCollaborativeModalOpen(false)}
        isOpen={collaborativeModalOpen}
      />
    </div>
  )
}
