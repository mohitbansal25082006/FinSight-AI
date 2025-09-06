'use client'

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Github, Mail } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleSignIn = async (providerId: string) => {
    setLoading(true)
    try {
      await signIn(providerId, {
        callbackUrl: "/dashboard",
        redirect: true,
      })
    } catch (error) {
      console.error("Sign in error:", error)
      setLoading(false)
    }
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return <Mail className="w-5 h-5" />
      case 'github':
        return <Github className="w-5 h-5" />
      default:
        return null
    }
  }

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'bg-red-600 hover:bg-red-700'
      case 'github':
        return 'bg-gray-900 hover:bg-gray-800'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-full">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to FinSight AI</CardTitle>
          <CardDescription>
            Sign in to access your trading dashboard and AI-powered insights
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error === 'OAuthSignin' && 'Error occurred during sign in.'}
              {error === 'OAuthCallback' && 'Error occurred during callback.'}
              {error === 'OAuthCreateAccount' && 'Could not create account.'}
              {error === 'EmailCreateAccount' && 'Could not create account.'}
              {error === 'Callback' && 'Error in callback.'}
              {error === 'OAuthAccountNotLinked' && 'Account not linked. Please sign in with the same provider you used before.'}
              {error === 'EmailSignin' && 'Check your email for sign in link.'}
              {error === 'CredentialsSignin' && 'Invalid credentials.'}
              {error === 'SessionRequired' && 'Please sign in to access this page.'}
              {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'SessionRequired'].includes(error) && 'An error occurred.'}
            </div>
          )}

          {providers ? (
            <div className="space-y-3">
              {Object.values(providers).map((provider) => (
                <Button
                  key={provider.name}
                  onClick={() => handleSignIn(provider.id)}
                  disabled={loading}
                  className={`w-full ${getProviderColor(provider.id)} text-white`}
                  size="lg"
                >
                  {getProviderIcon(provider.id)}
                  <span className="ml-2">
                    {loading ? 'Signing in...' : `Continue with ${provider.name}`}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-md animate-pulse" />
            </div>
          )}

          <div className="text-center text-sm text-gray-600 mt-6">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </div>

          <div className="text-center">
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              ← Back to homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}