"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  ShoppingCart,
  Store,
  Factory,
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  ShoppingBag,
  BookOpen,
  History,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavigationItem = {
  name: string
  href: string
  icon: typeof LayoutDashboard
}

type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

const primaryNavigationItem: NavigationItem = {
  name: "ダッシュボード",
  href: "/",
  icon: LayoutDashboard,
}

const navigationGroups: NavigationGroup[] = [
  {
    label: "発注",
    items: [
      { name: "発注管理", href: "/orders", icon: ShoppingCart },
      { name: "購入リスト", href: "/purchasing", icon: ShoppingBag },
    ],
  },
  {
    label: "商品・在庫",
    items: [
      { name: "商品マスター", href: "/products", icon: Package },
      { name: "メーカー", href: "/makers", icon: Factory },
      { name: "本部在庫", href: "/inventory", icon: ClipboardList },
      { name: "在庫アラート", href: "/alerts", icon: AlertTriangle },
    ],
  },
  {
    label: "店舗",
    items: [
      { name: "店舗", href: "/stores", icon: Store },
    ],
  },
  {
    label: "その他",
    items: [
      { name: "履歴", href: "/history", icon: History },
      { name: "マニュアル", href: "/manual", icon: BookOpen },
    ],
  },
]

const STORAGE_KEY = "sidebar:collapsedGroups"

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  // 初回マウント時に localStorage から開閉状態を復元（hydration mismatch を避けるため useState ではなく useEffect 内で行う）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]))
    } catch {
      // ignore invalid JSON
    }
    setHydrated(true)
  }, [])

  // pathname 変更ごとに、現在ページを含むグループは強制的に展開（active項目の見失い防止）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed((prev) => {
      let next = prev
      for (const group of navigationGroups) {
        const hasActiveChild = group.items.some((item) =>
          pathname === item.href || pathname?.startsWith(`${item.href}/`)
        )
        if (hasActiveChild && next.has(group.label)) {
          if (next === prev) next = new Set(prev)
          next.delete(group.label)
        }
      }
      return next
    })
  }, [pathname])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(collapsed)))
    } catch {
      // storage not available
    }
  }, [collapsed, hydrated])

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname?.startsWith(`${item.href}/`)

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="size-4" />
        {item.name}
      </Link>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r bg-card no-print">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <Package className="size-6 text-primary" />
          <span className="font-semibold">在庫管理システム</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[calc(100dvh-4rem)]">
        <div className="space-y-1">
          {renderNavigationItem(primaryNavigationItem)}
        </div>

        {navigationGroups.map((group) => {
          const isCollapsed = collapsed.has(group.label)
          return (
            <div key={group.label} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={!isCollapsed}
                className="group/label flex w-full items-center justify-between px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground/80 hover:text-foreground transition-colors"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    isCollapsed && "-rotate-90"
                  )}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-1">
                  {group.items.map((item) => renderNavigationItem(item))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
