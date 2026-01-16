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
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "ダッシュボード", href: "/", icon: LayoutDashboard },
  { name: "商品マスター", href: "/products", icon: Package },
  { name: "メーカーマスター", href: "/makers", icon: Factory },
  { name: "店舗マスター", href: "/stores", icon: Store },
  { name: "担当者マスター", href: "/staff", icon: Users },
  { name: "本部在庫", href: "/inventory", icon: ClipboardList },
  { name: "発注管理", href: "/orders", icon: ShoppingCart },
  { name: "購入リスト", href: "/purchasing", icon: ShoppingBag },
  { name: "在庫アラート", href: "/alerts", icon: AlertTriangle },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r bg-card no-print">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <Package className="size-6 text-primary" />
          <span className="font-semibold">在庫管理システム</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
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
        })}
      </nav>
    </aside>
  )
}
