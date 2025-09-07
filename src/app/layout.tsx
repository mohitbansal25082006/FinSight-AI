import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { AuthButton } from '@/components/auth/auth-button';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
          <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">FS</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">FinSight AI</span>
                  </Link>
                  
                  {session && (
                    <nav className="hidden md:flex space-x-6">
                      <Link 
                        href="/dashboard" 
                        className="text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/dashboard" 
                        className="text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        Markets
                      </Link>
                      <Link 
                        href="/dashboard" 
                        className="text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        Portfolio
                      </Link>
                    </nav>
                  )}
                </div>
                
                <AuthButton />
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