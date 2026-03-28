import './assets/main.css'
import './assets/base.css'
import { createRoot } from 'react-dom/client'
import App from './App'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
} else {
  document.body.innerHTML = '<h1 style="color:red">ROOT NOT FOUND!</h1>'
}
