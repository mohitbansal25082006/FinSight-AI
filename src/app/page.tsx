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
  Linkedin,
  DollarSign,
  Target,
  Newspaper,
  Bot,
  PieChart,
  Bell,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { signIn } from "next-auth/react"
import { useSession } from "next-auth/react"
import { AuthButton } from "@/components/auth/auth-button"
import { motion } from 'framer-motion'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }
  
  const handleGithubSignIn = () => {
    signIn('github', { callbackUrl: '/dashboard' })
  }
  
  const handleGoToDashboard = () => {
    window.location.href = '/dashboard'
  }

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      title: "Real-Time Market Data",
      description: "Live stock and crypto prices with interactive charts powered by Finnhub and Yahoo Finance.",
      badge: "Live Data"
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-600" />,
      title: "AI-Powered Insights",
      description: "OpenAI-driven news summarization and market predictions to guide your investment decisions.",
      badge: "AI Powered"
    },
    {
      icon: <Target className="h-8 w-8 text-green-600" />,
      title: "Portfolio Simulation",
      description: "Virtual trading with 'what-if' scenarios to test investment strategies without risk.",
      badge: "Risk Free"
    },
    {
      icon: <Newspaper className="h-8 w-8 text-orange-600" />,
      title: "Financial News Feed",
      description: "Curated financial news with AI sentiment analysis and key insights extraction.",
      badge: "Real-Time"
    },
    {
      icon: <PieChart className="h-8 w-8 text-pink-600" />,
      title: "Advanced Analytics",
      description: "Portfolio performance tracking, allocation charts, and profit/loss analysis.",
      badge: "Analytics"
    },
    {
      icon: <Bell className="h-8 w-8 text-yellow-600" />,
      title: "Smart Notifications",
      description: "Personalized alerts for price movements, news, and portfolio updates.",
      badge: "Coming Soon"
    }
  ];

  const stats = [
    { label: "Market Cap Tracked", value: "$50T+", icon: <DollarSign className="h-5 w-5" /> },
    { label: "AI Predictions Daily", value: "10K+", icon: <Bot className="h-5 w-5" /> },
    { label: "News Articles Analyzed", value: "500+", icon: <Newspaper className="h-5 w-5" /> },
    { label: "Active Portfolios", value: "1K+", icon: <Target className="h-5 w-5" /> }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Individual Investor",
      content: "The AI insights have helped me make better investment decisions. The portfolio simulator is incredibly useful for testing strategies.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Day Trader",
      content: "Real-time data and predictive analytics in one place. This platform has streamlined my trading workflow significantly.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Financial Advisor",
      content: "I recommend FinSight AI to my clients. The combination of traditional analysis and AI insights is powerful.",
      rating: 5
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-5 sm:py-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
              🚀 Now with Advanced AI Features
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl font-bold mb-8 bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
              AI-Powered Financial Intelligence Platform
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Make smarter investment decisions with real-time market data, AI-driven insights, 
              and advanced portfolio analytics. All in one beautiful, intuitive platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {session ? (
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-8"
                  asChild
                >
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
                    onClick={handleGoogleSignIn}
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleGithubSignIn}>
                    <Github className="mr-2 h-4 w-4" />
                    Sign in with GitHub
                  </Button>
                </>
              )}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2 text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              Platform Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for Smart Investing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful tools and AI-driven insights to help you make informed investment decisions 
              in today's dynamic markets.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      {feature.icon}
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-50 text-purple-700 border-purple-200">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get Started in Minutes
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Sign Up & Connect",
                description: "Create your account using Google or GitHub. Setup takes less than 30 seconds.",
                icon: <Shield className="h-8 w-8 text-green-600" />
              },
              {
                step: "2",
                title: "Build Your Watchlist",
                description: "Search and add stocks, crypto, or other assets you want to track and analyze.",
                icon: <Star className="h-8 w-8 text-blue-600" />
              },
              {
                step: "3",
                title: "Get AI Insights",
                description: "Receive personalized AI-driven analysis, predictions, and investment recommendations.",
                icon: <Brain className="h-8 w-8 text-purple-600" />
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="mb-6">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {step.icon}
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto -mt-12 mb-4 text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-50 text-yellow-700 border-yellow-200">
              User Reviews
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by Investors Worldwide
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-white"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform Your Investment Strategy?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of investors who are already using AI to make smarter financial decisions.
            </p>
            
            {session ? (
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8"
                asChild
              >
                <Link href="/dashboard">
                  Access Your Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8"
                  onClick={handleGoogleSignIn}
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-4 text-blue-100">
                  <div className="flex items-center space-x-2">
                    <Github className="h-4 w-4" />
                    <span className="text-sm">Sign up with GitHub</span>
                  </div>
                  <span>or</span>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-sm">Sign up with Google</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">FinSight AI</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-powered financial intelligence for smarter investment decisions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-white">Portfolio</Link></li>
                <li><Link href="#" className="hover:text-white">Analytics</Link></li>
                <li><Link href="#" className="hover:text-white">AI Insights</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white">API Reference</Link></li>
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <p className="text-slate-400 text-sm mb-4 sm:mb-0">
                &copy; 2024 FinSight AI. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-4">
              Made with ❤️ using Next.js & AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}