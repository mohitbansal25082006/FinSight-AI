import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "FinSight AI - Smart Trading with AI Insights",
  description: "Transform your investment strategy with real-time market data, AI-powered analysis, and intelligent portfolio management.",
  keywords: ["trading", "AI", "stocks", "crypto", "portfolio", "investment", "fintech", "market data"],
  authors: [{ name: "FinSight AI Team" }],
  creator: "FinSight AI",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    title: "FinSight AI - Smart Trading with AI Insights",
    description: "Transform your investment strategy with real-time market data, AI-powered analysis, and intelligent portfolio management.",
    siteName: "FinSight AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinSight AI - Smart Trading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinSight AI - Smart Trading with AI Insights",
    description: "Transform your investment strategy with real-time market data, AI-powered analysis, and intelligent portfolio management.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}