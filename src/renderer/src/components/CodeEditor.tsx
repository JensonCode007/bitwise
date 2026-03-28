import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  projectPath: string | null
  openFile?: { path: string; name: string } | null
}

const getLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    md: 'markdown',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sql: 'sql'
  }
  return langMap[ext || ''] || 'plaintext'
}

export const CodeEditor = ({ projectPath, openFile }: CodeEditorProps) => {
  const [code, setCode] = useState('// Select a file from the sidebar to edit\n')
  const [fileName, setFileName] = useState('untitled')
  const [language, setLanguage] = useState('typescript')

  useEffect(() => {
    if (projectPath) {
      setCode('// Select a file from the sidebar to edit\n')
      setFileName('welcome')
      setLanguage('typescript')
    }
  }, [projectPath])

  useEffect(() => {
    if (openFile) {
      setFileName(openFile.name)
      setLanguage(getLanguage(openFile.name))

      window.api.fs.readFile(openFile.path).then((result) => {
        if (result.success && result.content) {
          try {
            const content = atob(result.content)
            setCode(content)
          } catch {
            setCode('// Unable to decode file content\n')
          }
        } else {
          setCode('// Error reading file\n')
        }
      })
    }
  }, [openFile])

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-2xl relative">
      <div className="absolute top-0 left-0 right-0 h-10 bg-black/40 border-b border-[#2a2a2a] flex items-center px-4 z-10 backdrop-blur-sm">
        <div className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-md border border-white/10">
          <span className="text-xs text-gray-300 font-medium">{fileName}</span>
        </div>
      </div>
      <div className="pt-10 h-full w-full">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={(_, monaco) => {
            monaco.editor.defineTheme('bitwise-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#0a0a0a',
                'editor.lineHighlightBackground': '#1a1a1a',
                'editorLineNumber.foreground': '#444444',
                'editorLineNumber.activeForeground': '#ffffff',
                'editor.selectionBackground': '#333333',
                'editorCursor.foreground': '#ffffff',
                'scrollbarSlider.background': '#33333366',
                'scrollbarSlider.hoverBackground': '#44444499',
                'scrollbarSlider.activeBackground': '#555555bb'
              }
            })
            monaco.editor.setTheme('bitwise-dark')
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: true
            })

            // Disable for TypeScript
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: true
            })
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            padding: { top: 20 },
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            }
          }}
          loading={
            <div className="h-full w-full flex items-center justify-center text-gray-500 font-medium animate-pulse">
              Loading...
            </div>
          }
        />
      </div>
    </div>
  )
}
