import {
  FolderOpen,
  Plus,
  Settings,
  FileCode2,
  ChevronRight,
  TerminalSquare,
  SquarePlus
} from 'lucide-react'

interface WelcomePageProps {
  onEnterIde: (projectPath?: string) => void
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onEnterIde }) => {
  const handleOpenFolder = async () => {
    const folderPath = await window.api.dialog.openFolder()
    if (folderPath) {
      onEnterIde(folderPath)
    }
  }

  const handleNewProject = () => {
    onEnterIde()
  }

  return (
    // Outer container: Black background, padding to create the outer "Island" spacing
    <div className="min-h-screen bg-black text-neutral-200 p-4 md:p-6 font-sans flex flex-col gap-6 selection:bg-neutral-800">
      {/* Top Header Island */}
      <header className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#0a0a0a] p-4 px-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <TerminalSquare size={20} strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Bitwise IDE</h1>
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

              <button className="group flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-[#0a0a0a]">
                    <SquarePlus size={20} className="text-neutral-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white">Join session</h3>
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
            <h2 className="text-xl font-medium tracking-tight text-white mb-6">Recent Projects</h2>

            <div className="flex flex-col gap-2">
              {[
                { name: 'bitwise-client', path: '~/dev/bitwise-client', time: '2 mins ago' },
                {
                  name: 'nextjs-dashboard',
                  path: '~/projects/nextjs-dashboard',
                  time: 'Yesterday'
                },
                { name: 'electron-app', path: '~/dev/electron-app', time: '3 days ago' },
                { name: 'ui-components', path: '~/design/ui-components', time: 'Last week' }
              ].map((project, i) => (
                <button
                  key={i}
                  className="group flex items-start justify-between rounded-lg p-3 hover:bg-neutral-900 transition-colors text-left border border-transparent hover:border-neutral-800"
                >
                  <div className="flex gap-3">
                    <FileCode2
                      size={18}
                      className="mt-1 text-neutral-500 group-hover:text-white transition-colors"
                    />
                    <div>
                      <h4 className="font-medium text-neutral-300 group-hover:text-white transition-colors">
                        {project.name}
                      </h4>
                      <p className="text-xs text-neutral-600">{project.path}</p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-600">{project.time}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default WelcomePage
