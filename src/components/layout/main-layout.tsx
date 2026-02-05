"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const isStorePage = pathname?.startsWith("/store")

  if (isStorePage) {
    return (
      <div className="min-h-dvh bg-background">
        <main className="min-h-dvh">
          <div className="mx-auto max-w-4xl p-6">{children}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <main className="ml-64 min-h-dvh">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
