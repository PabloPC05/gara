import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: '#991b1b', background: '#fef2f2', minHeight: '100vh' }}>
          <h1 style={{ fontWeight: 'bold', fontSize: 20 }}>App crashed</h1>
          <p style={{ marginTop: 8, fontWeight: 'bold' }}>{String(this.state.error?.message || this.state.error)}</p>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 16, fontSize: 12 }}>{String(this.state.error?.stack || '')}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
