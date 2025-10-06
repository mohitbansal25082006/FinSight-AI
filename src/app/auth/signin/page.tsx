'use client'

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Github, Mail, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Image from "next/image"

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
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
      case 'github':
        return 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black'
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md backdrop-blur-lg bg-white/80 border-0 shadow-2xl overflow-hidden relative z-10">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-md opacity-70 animate-pulse"></div>
              <div className="relative bg-white p-1 rounded-full">
                <Image 
                  src="/logo.png" 
                  alt="FinSight AI Logo" 
                  width={120} 
                  height={120}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Welcome to FinSight AI
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Sign in to access your trading dashboard and AI-powered insights
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 pb-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                  <div className="mt-2 text-sm text-red-700">
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
                </div>
              </div>
            </div>
          )}

          {providers ? (
            <div className="space-y-4">
              {Object.values(providers).map((provider) => (
                <Button
                  key={provider.name}
                  onClick={() => handleSignIn(provider.id)}
                  disabled={loading}
                  className={`w-full ${getProviderColor(provider.id)} text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center group`}
                  size="lg"
                >
                  <div className="flex items-center justify-center w-full">
                    {getProviderIcon(provider.id)}
                    <span className="ml-3 font-medium">
                      {loading ? 'Signing in...' : `Continue with ${provider.name}`}
                    </span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          )}

          <div className="text-center text-sm text-gray-600 mt-8 pt-6 border-t border-gray-200">
            <p>
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors duration-200">
              <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
              Back to homepage
            </Link>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}