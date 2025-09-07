'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  TrendingUp, 
  Brain, 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  Star, 
  ArrowRight,
  Menu,
  X,
  Github,
  Mail,
  Twitter,
  Linkedin
} from 'lucide-react'
import Link from 'next/link'
import { signIn } from "next-auth/react"
import { AuthButton } from "@/components/auth/auth-button"
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }
  
  const handleGithubSignIn = () => {
    signIn('github', { callbackUrl: '/dashboard' })
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1 text-sm">
            <Zap className="w-4 h-4 mr-2" />
            Powered by AI & Real-time Data
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Smart Trading with
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> AI Insights</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your investment strategy with real-time market data, AI-powered analysis, 
            and intelligent portfolio management. Make informed decisions backed by cutting-edge technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              onClick={handleGoogleSignIn}
              size="lg" 
              className="bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 px-8 py-3 flex items-center"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>
            <Button 
              onClick={handleGithubSignIn}
              size="lg" 
              className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 flex items-center"
            >
              <Github className="w-5 h-5 mr-3" />
              Sign in with GitHub
            </Button>
          </div>
          {/* Hero Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">10K+</div>
              <div className="text-slate-600">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">$2M+</div>
              <div className="text-slate-600">Assets Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">99.9%</div>
              <div className="text-slate-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive tools and insights to help you make smarter investment decisions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-lg w-fit mb-4">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Advanced machine learning algorithms analyze market trends and provide intelligent recommendations
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-lg w-fit mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Real-time Data</CardTitle>
                <CardDescription>
                  Live market data updates every minute with comprehensive stock and crypto tracking
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg w-fit mb-4">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Portfolio Simulator</CardTitle>
                <CardDescription>
                  Test investment strategies with virtual portfolios before risking real money
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="bg-gradient-to-r from-orange-100 to-red-100 p-3 rounded-lg w-fit mb-4">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Secure & Reliable</CardTitle>
                <CardDescription>
                  Bank-level security with 99.9% uptime and encrypted data protection
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="bg-gradient-to-r from-teal-100 to-cyan-100 p-3 rounded-lg w-fit mb-4">
                  <Zap className="h-8 w-8 text-teal-600" />
                </div>
                <CardTitle className="text-xl">Instant Alerts</CardTitle>
                <CardDescription>
                  Get notified of important market movements and opportunities in real-time
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-3 rounded-lg w-fit mb-4">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Community Insights</CardTitle>
                <CardDescription>
                  Learn from top traders and share strategies with our active community
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600">
              Choose the plan that's right for you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold text-slate-900 mt-4">$0</div>
                <div className="text-slate-600">Forever free</div>
              </CardHeader>
              <CardContent className="pt-6">
                <Button className="w-full mb-6" variant="outline">Get Started</Button>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>5 watchlist items</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Basic market data</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Simple portfolio tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            {/* Pro Plan */}
            <Card className="border-2 border-blue-200 relative hover:shadow-xl transition-all duration-300 scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-4xl font-bold text-slate-900 mt-4">$29</div>
                <div className="text-slate-600">per month</div>
              </CardHeader>
              <CardContent className="pt-6">
                <Button className="w-full mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Start Free Trial
                </Button>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Unlimited watchlist</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Real-time data & alerts</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>AI-powered insights</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Portfolio simulator</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            {/* Enterprise Plan */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-slate-900 mt-4">$99</div>
                <div className="text-slate-600">per month</div>
              </CardHeader>
              <CardContent className="pt-6">
                <Button className="w-full mb-6" variant="outline">Contact Sales</Button>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Testimonials Section - FIXED AVATARS */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Trusted by thousands of traders
            </h2>
            <p className="text-xl text-slate-600">
              See what our users are saying about FinSight AI
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  &quot;FinSight AI has completely transformed how I approach trading. The AI insights are incredibly accurate and have helped me make better investment decisions.&quot;
                </p>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">SC</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-slate-900">Sarah Chen</div>
                    <div className="text-sm text-slate-600">Portfolio Manager</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  &quot;The real-time data and portfolio simulator are game-changers. I can test strategies without risking real money. Absolutely recommended!&quot;
                </p>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold">MR</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-slate-900">Mike Rodriguez</div>
                    <div className="text-sm text-slate-600">Day Trader</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  &quot;As a beginner, this platform made investing accessible and less intimidating. The educational features and AI guidance are exceptional.&quot;
                </p>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold">EJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-slate-900">Emily Johnson</div>
                    <div className="text-sm text-slate-600">Investment Enthusiast</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of successful traders using FinSight AI to make smarter investment decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGoogleSignIn}
              size="lg" 
              className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-3 flex items-center"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>
            <Button 
              onClick={handleGithubSignIn}
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 flex items-center"
            >
              <Github className="w-5 h-5 mr-3" />
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl">FinSight AI</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                Empowering traders with AI-driven insights, real-time data, and intelligent portfolio management for smarter investment decisions.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Mail className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">API</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-slate-400">
              © 2025 FinSight AI. All rights reserved. Built with ❤️ for traders worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}