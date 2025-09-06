import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - FinSight AI",
  description: "Your personal trading dashboard with AI-powered insights",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}