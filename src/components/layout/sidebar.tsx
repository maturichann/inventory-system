"use client"

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
  Users,
  ShoppingBag,
  BookOpen,
  History,
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
    label: "商品・在庫",
    items: [
      { name: "商品マスター", href: "/products", icon: Package },
      { name: "メーカー", href: "/makers", icon: Factory },
      { name: "本部在庫", href: "/inventory", icon: ClipboardList },
      { name: "在庫アラート", href: "/alerts", icon: AlertTriangle },
    ],
  },
  {
    label: "発注",
    items: [
      { name: "発注管理", href: "/orders", icon: ShoppingCart },
      { name: "購入リスト", href: "/purchasing", icon: ShoppingBag },
    ],
  },
  {
    label: "組織",
    items: [
      { name: "店舗", href: "/stores", icon: Store },
      { name: "担当者", href: "/staff", icon: Users },
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

export function Sidebar() {
  const pathname = usePathname()

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
      <nav className="flex flex-col gap-6 p-4">
        <div className="space-y-1">
          {renderNavigationItem(primaryNavigationItem)}
        </div>

        {navigationGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground/80">
              {group.label}
            </p>
            {group.items.map((item) => renderNavigationItem(item))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
