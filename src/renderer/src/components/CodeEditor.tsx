import { useState, useEffect, useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

interface CodeEditorProps {
  projectPath: string | null
  openFile?: { path: string; name: string } | null
  roomId?: string | null
  userName?: string
}

interface CursorData {
  userId: string
  userName: string
  filePath: string
  position: { lineNumber: number; column: number }
}

const fileContentCache = new Map<string, string>()
const cursorDecorations = new Map<string, string[]>()

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

export const CodeEditor = ({ projectPath, openFile, roomId, userName }: CodeEditorProps) => {
  const [code, setCode] = useState('// Select a file from the sidebar to edit\n')
  const [language, setLanguage] = useState('typescript')
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [otherCursors, setOtherCursors] = useState<CursorData[]>([])
  const [filesLoaded, setFilesLoaded] = useState(false)
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const isRemoteUpdate = useRef(false)
  const codeRef = useRef('// Select a file from the sidebar to edit\n')

  useEffect(() => {
    if (projectPath) {
      setCode('// Select a file from the sidebar to edit\n')
      setLanguage('typescript')
      setActiveFilePath(null)
    }
  }, [projectPath])

  const loadFromCache = (filePath: string) => {
    let cached = fileContentCache.get(filePath)
    if (cached) {
      isRemoteUpdate.current = true
      setCode(cached)
      codeRef.current = cached
      isRemoteUpdate.current = false
      return true
    }

    const fileName = filePath.split('/').pop() || ''
    for (const [cachedPath, content] of fileContentCache.entries()) {
      if (cachedPath.endsWith('/' + fileName) || cachedPath.endsWith(fileName)) {
        isRemoteUpdate.current = true
        setCode(content)
        codeRef.current = content
        isRemoteUpdate.current = false
        return true
      }
    }
    return false
  }

  useEffect(() => {
    if (!roomId || !window.api.collab) return

    const unsubscribeAllFileContents = window.api.collab.onAllFileContents((contents) => {
      contents.forEach(([filePath, content]) => {
        fileContentCache.set(filePath, content)
      })
      setFilesLoaded(true)

      if (activeFilePath && !projectPath) {
        loadFromCache(activeFilePath)
      }
    })

    const unsubscribeFileContent = window.api.collab.onFileContent((data) => {
      fileContentCache.set(data.filePath, data.content)
      setFilesLoaded(true)
      if (activeFilePath === data.filePath && !projectPath) {
        loadFromCache(activeFilePath)
      }
    })

    window.api.collab.requestAllFiles(roomId)

    return () => {
      unsubscribeAllFileContents()
      unsubscribeFileContent()
    }
  }, [roomId])

  useEffect(() => {
    if (!openFile || !roomId || !window.api.collab || projectPath) return

    if (filesLoaded) {
      loadFromCache(openFile.path)
    } else {
      setCode('// Loading file...\n')
      window.api.collab.requestAllFiles(roomId)
      const timer = setTimeout(() => {
        if (!filesLoaded) {
          window.api.collab.requestAllFiles(roomId)
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [openFile, roomId, projectPath])

  useEffect(() => {
    if (openFile) {
      setActiveFilePath(openFile.path)
      setLanguage(getLanguage(openFile.name))

      if (loadFromCache(openFile.path)) {
        return
      }

      if (!projectPath) {
        setCode('// Loading file...\n')
        return
      }

      window.api.fs.readFile(openFile.path).then((result) => {
        if (result.success && result.content) {
          try {
            const content = atob(result.content)
            isRemoteUpdate.current = true
            setCode(content)
            codeRef.current = content
            fileContentCache.set(openFile.path, content)
            isRemoteUpdate.current = false
            if (roomId && window.api.collab) {
              window.api.collab.sendFileContent(roomId, openFile.path, content)
            }
          } catch {
            setCode('// Unable to decode file content\n')
          }
        } else {
          setCode('// Error reading file\n')
        }
      })
    }
  }, [openFile, projectPath])

  useEffect(() => {
    if (!roomId || !window.api.collab) return

    const unsubscribe = window.api.collab.onCodeUpdate((data) => {
      if (data.filePath === activeFilePath) {
        isRemoteUpdate.current = true
        setCode(data.code)
        codeRef.current = data.code
        fileContentCache.set(data.filePath, data.code)
        isRemoteUpdate.current = false
      }
    })

    return () => unsubscribe()
  }, [roomId, activeFilePath, projectPath])

  useEffect(() => {
    if (!roomId || !window.api.collab || !editorRef.current || !monacoRef.current) return

    const unsubscribe = window.api.collab.onCursorUpdate((data) => {
      if (!data || !data.userName || !data.position) return

      setOtherCursors((prev) => {
        const filtered = prev.filter((c) => c.userId !== data.userId)
        return [...filtered, data]
      })
    })

    return () => unsubscribe()
  }, [roomId])

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    const monaco = monacoRef.current

    otherCursors.forEach((cursor) => {
      if (cursor.filePath !== activeFilePath) return

      const oldDecorations = cursorDecorations.get(cursor.userId) || []

      const safeUserId = cursor.userId.replace(/[^a-zA-Z0-9]/g, '')

      const newDecorations = editor.deltaDecorations(oldDecorations, [
        {
          range: new monaco.Range(
            cursor.position.lineNumber,
            cursor.position.column,
            cursor.position.lineNumber,
            cursor.position.column
          ),
          options: {
            className: 'remote-cursor',
            hoverMessage: { value: cursor.userName }
          }
        },
        {
          range: new monaco.Range(
            cursor.position.lineNumber,
            cursor.position.column,
            cursor.position.lineNumber,
            cursor.position.column
          ),
          options: {
            afterContentClassName: `remote-cursor-label-${safeUserId}`,
            hoverMessage: { value: cursor.userName }
          }
        }
      ])

      cursorDecorations.set(cursor.userId, newDecorations)
    })
  }, [otherCursors, activeFilePath])

  const handleCodeChange = (value: string | undefined) => {
    if (!value || isRemoteUpdate.current) return

    const oldCode = codeRef.current
    codeRef.current = value
    setCode(value)

    if (roomId && activeFilePath && window.api.collab) {
      window.api.collab.sendCodeChange(roomId, activeFilePath, oldCode, value, userName || 'User')
      window.api.collab.sendFileContent(roomId, activeFilePath, value)
    }
  }

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.onDidChangeCursorPosition((e: any) => {
      if (roomId && activeFilePath && window.api.collab) {
        window.api.collab.sendCursorChange(
          roomId,
          activeFilePath,
          { lineNumber: e.position.lineNumber, column: e.position.column },
          userName || 'User'
        )
      }
    })

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
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true
    })
  }

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-2xl relative">
      <div className="h-full w-full">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
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
