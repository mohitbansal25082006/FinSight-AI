import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { AuthButton } from '@/components/auth/auth-button';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinSight AI - Stock Market Analytics',
  description: 'Advanced financial analytics with AI-powered insights',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-3 group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-md opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
                      <div className="relative bg-white p-1 rounded-full">
                        <Image 
                          src="/logo.png" 
                          alt="FinSight AI Logo" 
                          width={40} 
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                        FinSight AI
                      </span>
                      <span className="text-xs text-gray-500">Smart Trading Platform</span>
                    </div>
                  </Link>
                </div>
                
                <div className="flex items-center space-x-4">
                  {session && (
                    <div className="hidden md:flex items-center space-x-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm text-gray-600">Live Data</span>
                    </div>
                  )}
                  <AuthButton />
                </div>
              </div>
            </div>
          </header>

          <main>{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}