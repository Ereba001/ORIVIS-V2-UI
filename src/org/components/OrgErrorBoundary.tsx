import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class OrgErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Error boundary catch — no console output in production
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-status-danger/10 rounded-full">
              <AlertTriangle className="w-6 h-6 text-status-danger" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-brand-text-muted mb-6">
              {this.state.error?.message || 'An unexpected error occurred in the workspace.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-brand-text-primary text-brand-bg text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/org/dashboard"
                className="px-4 py-2 text-sm text-brand-text-muted hover:text-brand-text-primary transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default OrgErrorBoundary
