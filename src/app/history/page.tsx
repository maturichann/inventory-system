"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Package, ShoppingCart, ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Order, Store, InventoryHistory, Product } from "@/types/database"

type OrderWithStore = Order & {
  stores: Store | null
}

type InventoryHistoryWithProduct = InventoryHistory & {
  products: Product | null
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<OrderWithStore[]>([])
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistoryWithProduct[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [storeFilter, setStoreFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("orders")

  const supabase = createClient()

  const fetchData = async () => {
    setIsLoading(true)

    const [ordersRes, inventoryRes, storesRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*, stores (*)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("inventory_history")
        .select("*, products (*)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("stores").select("*").eq("is_active", true).order("store_name"),
    ])

    if (ordersRes.data) setOrders(ordersRes.data as OrderWithStore[])
    if (inventoryRes.data) setInventoryHistory(inventoryRes.data as InventoryHistoryWithProduct[])
    if (storesRes.data) setStores(storesRes.data)

    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredOrders = orders.filter(order => {
    if (storeFilter === "all") return true
    return order.store_id === storeFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">未処理</Badge>
      case "processing":
        return <Badge variant="default">処理中</Badge>
      case "completed":
        return <Badge variant="success">完了</Badge>
      case "cancelled":
        return <Badge variant="destructive">キャンセル</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case "in":
        return <ArrowUp className="size-4 text-green-500" />
      case "out":
        return <ArrowDown className="size-4 text-red-500" />
      case "adjust":
        return <RefreshCw className="size-4 text-blue-500" />
      default:
        return null
    }
  }

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case "in":
        return <Badge variant="success">入庫</Badge>
      case "out":
        return <Badge variant="destructive">出庫</Badge>
      case "adjust":
        return <Badge variant="default">調整</Badge>
      case "order_fulfill":
        return <Badge variant="secondary">発注対応</Badge>
      default:
        return <Badge variant="secondary">{changeType}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-balance">履歴</h1>
        <p className="text-muted-foreground text-pretty">
          発注履歴・在庫変動履歴を確認できます
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="size-4" />
            発注履歴
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="size-4" />
            在庫履歴
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">発注履歴</CardTitle>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="店舗で絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての店舗</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.store_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <p className="text-sm">発注履歴がありません</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>発注番号</TableHead>
                      <TableHead>店舗</TableHead>
                      <TableHead>発注日</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>完了日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.order_number}
                        </TableCell>
                        <TableCell>{order.stores?.store_name || "-"}</TableCell>
                        <TableCell>{formatDateTime(order.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {order.completed_at ? formatDateTime(order.completed_at) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">在庫変動履歴</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : inventoryHistory.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <p className="text-sm">在庫変動履歴がありません</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日時</TableHead>
                      <TableHead>商品</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead className="text-right tabular-nums">変動数</TableHead>
                      <TableHead className="text-right tabular-nums">変動前</TableHead>
                      <TableHead className="text-right tabular-nums">変動後</TableHead>
                      <TableHead>理由</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(history.created_at)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{history.products?.product_name || "-"}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {history.products?.product_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getChangeTypeIcon(history.change_type)}
                            {getChangeTypeBadge(history.change_type)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {history.change_type === "in" ? "+" : history.change_type === "out" ? "-" : ""}
                          {history.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {history.previous_quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {history.new_quantity}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {history.reason || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
