'use client'

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { ErrorBoundary } from "react-error-boundary"

interface ProvidersProps {
  children: ReactNode
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-600 mb-4">We encountered an unexpected error. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-slate-500">Error Details</summary>
            <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SessionProvider
        refetchInterval={5 * 60} // Refetch session every 5 minutes
        refetchOnWindowFocus={true}
      >
        {children}
      </SessionProvider>
    </ErrorBoundary>
  )
}