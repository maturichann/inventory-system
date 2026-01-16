"use client"

import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <main className="ml-64 min-h-dvh">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
