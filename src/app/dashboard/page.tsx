'use client'

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Eye,
  Plus,
  Activity,
  Target,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { AuthButton } from "@/components/auth/auth-button"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    redirect("/auth/signin")
  }

  // Mock data for demonstration
  const portfolioValue = 125430.50
  const dailyChange = 2847.23
  const dailyChangePercent = 2.32
  const isPositive = dailyChange > 0

  const watchlistStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 195.84, change: 2.34, changePercent: 1.21 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.56, change: -1.82, changePercent: -1.26 },
    { symbol: "TSLA", name: "Tesla, Inc.", price: 248.91, change: 8.45, changePercent: 3.51 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85, change: 4.21, changePercent: 1.12 },
  ]

  const portfolioStocks = [
    { symbol: "AAPL", shares: 50, value: 9792, change: 117 },
    { symbol: "GOOGL", shares: 25, value: 3564, change: -46 },
    { symbol: "TSLA", shares: 15, value: 3734, change: 127 },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">FinSight AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Welcome back, {session.user?.name}</span>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
              <AvatarFallback className="text-lg">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome back, {session.user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-slate-600">Here's what's happening with your investments today.</p>
            </div>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolioValue.toLocaleString()}</div>
              <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                ${Math.abs(dailyChange).toLocaleString()} ({Math.abs(dailyChangePercent)}%)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">3 winners, 1 loser today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Watchlist Items</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{watchlistStocks.length}</div>
              <p className="text-xs text-muted-foreground">2 alerts triggered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Recommendations</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">New opportunities</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Watchlist */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Watchlist</CardTitle>
                    <CardDescription>Your tracked stocks and their performance</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {watchlistStocks.map((stock, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{stock.symbol}</div>
                          <div className="text-sm text-slate-600">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${stock.price.toFixed(2)}</div>
                        <div className={`text-sm flex items-center ${stock.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Holdings</CardTitle>
                <CardDescription>Your current positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioStocks.map((stock, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-sm text-slate-600">{stock.shares} shares</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${stock.value.toLocaleString()}</div>
                        <div className={`text-sm ${stock.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change > 0 ? '+' : ''}${stock.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Watchlist
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <PieChart className="h-4 w-4 mr-2" />
                    Portfolio Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    AI Recommendations
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market</span>
                    <Badge className="bg-green-100 text-green-800">Open</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">S&P 500</span>
                    <span className="text-sm text-green-600">+0.85%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">NASDAQ</span>
                    <span className="text-sm text-green-600">+1.23%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">DOW</span>
                    <span className="text-sm text-red-600">-0.34%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}