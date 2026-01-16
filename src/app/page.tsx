"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import type { Product, Order, HqInventory, Store, Staff } from "@/types/database"
import Link from "next/link"

type ProductWithInventory = Product & {
  hq_inventory: HqInventory | null
}

type OrderWithDetails = Order & {
  stores: Store | null
  staff: Staff | null
}

export default function DashboardPage() {
  const [productCount, setProductCount] = useState(0)
  const [totalStock, setTotalStock] = useState(0)
  const [pendingOrderCount, setPendingOrderCount] = useState(0)
  const [alertCount, setAlertCount] = useState(0)
  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<ProductWithInventory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchDashboardData = async () => {
    setIsLoading(true)

    const [productsRes, ordersRes] = await Promise.all([
      supabase
        .from("products")
        .select(`*, hq_inventory (*)`)
        .eq("is_active", true),
      supabase
        .from("orders")
        .select(`*, stores (*), staff (*)`)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    if (productsRes.data) {
      const products = productsRes.data as ProductWithInventory[]
      setProductCount(products.length)

      const stock = products.reduce((sum, p) => sum + (p.hq_inventory?.quantity ?? 0), 0)
      setTotalStock(stock)

      const alerts = products.filter(p => {
        const quantity = p.hq_inventory?.quantity ?? 0
        const threshold = p.hq_inventory?.threshold ?? 5
        return quantity <= threshold
      })
      setAlertCount(alerts.length)
      setLowStockProducts(alerts.slice(0, 5))
    }

    if (ordersRes.data) {
      const orders = ordersRes.data as OrderWithDetails[]
      setRecentOrders(orders)
      const pending = orders.filter(o => o.status === "pending").length
      setPendingOrderCount(pending)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">未処理</Badge>
      case "processing":
        return <Badge variant="default">処理中</Badge>
      case "completed":
        return <Badge variant="success">完了</Badge>
      case "cancelled":
        return <Badge variant="secondary">キャンセル</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-balance">ダッシュボード</h1>
        <p className="text-muted-foreground text-pretty">
          在庫状況と発注の概要を確認できます
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総商品数</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{productCount}</div>
            <p className="text-xs text-muted-foreground">登録済み商品</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本部在庫総数</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalStock.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">全商品の合計</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未処理発注</CardTitle>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{pendingOrderCount}</div>
            <p className="text-xs text-muted-foreground">処理待ち</p>
          </CardContent>
        </Card>

        <Card className={alertCount > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在庫アラート</CardTitle>
            <AlertTriangle className={`size-4 ${alertCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${alertCount > 0 ? "text-destructive" : ""}`}>
              {alertCount}
            </div>
            <p className="text-xs text-muted-foreground">閾値以下の商品</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近の発注</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <p className="text-sm">発注データがありません</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>発注番号</TableHead>
                    <TableHead>店舗</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>日付</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        <Link href="/orders" className="hover:underline">
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>{order.stores?.store_name || "-"}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(order.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className={alertCount > 0 ? "border-destructive" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              在庫アラート
              {alertCount > 0 && <Badge variant="destructive">{alertCount}件</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <p className="text-sm">アラートはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => {
                  const quantity = product.hq_inventory?.quantity ?? 0
                  const threshold = product.hq_inventory?.threshold ?? 5
                  return (
                    <div key={product.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">{product.product_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums text-destructive">{quantity}</p>
                        <p className="text-xs text-muted-foreground">閾値: {threshold}</p>
                      </div>
                    </div>
                  )
                })}
                {alertCount > 5 && (
                  <Link href="/alerts" className="block text-center text-sm text-primary hover:underline">
                    すべて表示 ({alertCount}件)
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
