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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Package, ShoppingCart, ArrowUp, ArrowDown, RefreshCw, Trash2 } from "lucide-react"
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
  
  // 選択状態の管理
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectedHistory, setSelectedHistory] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<"orders" | "history">("orders")

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

  // 発注の選択切り替え
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  // 全選択/全解除（発注）
  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
    }
  }

  // 在庫履歴の選択切り替え
  const toggleHistorySelection = (historyId: string) => {
    const newSelected = new Set(selectedHistory)
    if (newSelected.has(historyId)) {
      newSelected.delete(historyId)
    } else {
      newSelected.add(historyId)
    }
    setSelectedHistory(newSelected)
  }

  // 全選択/全解除（在庫履歴）
  const toggleAllHistory = () => {
    if (selectedHistory.size === inventoryHistory.length) {
      setSelectedHistory(new Set())
    } else {
      setSelectedHistory(new Set(inventoryHistory.map(h => h.id)))
    }
  }

  // 削除確認ダイアログを開く
  const openDeleteDialog = (target: "orders" | "history") => {
    setDeleteTarget(target)
    setShowDeleteDialog(true)
  }

  // 選択した発注を削除
  const deleteSelectedOrders = async () => {
    setIsDeleting(true)
    
    // まず関連するorder_itemsを削除
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .in("order_id", Array.from(selectedOrders))
    
    if (itemsError) {
      console.error("Error deleting order items:", itemsError)
      alert("発注明細の削除に失敗しました")
      setIsDeleting(false)
      return
    }

    // 次にordersを削除
    const { error: ordersError } = await supabase
      .from("orders")
      .delete()
      .in("id", Array.from(selectedOrders))

    if (ordersError) {
      console.error("Error deleting orders:", ordersError)
      alert("発注の削除に失敗しました")
      setIsDeleting(false)
      return
    }

    // 成功したらリストを更新
    setOrders(orders.filter(o => !selectedOrders.has(o.id)))
    setSelectedOrders(new Set())
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  // 選択した在庫履歴を削除
  const deleteSelectedHistory = async () => {
    setIsDeleting(true)

    const { error } = await supabase
      .from("inventory_history")
      .delete()
      .in("id", Array.from(selectedHistory))

    if (error) {
      console.error("Error deleting inventory history:", error)
      alert("在庫履歴の削除に失敗しました")
      setIsDeleting(false)
      return
    }

    setInventoryHistory(inventoryHistory.filter(h => !selectedHistory.has(h.id)))
    setSelectedHistory(new Set())
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  const handleDelete = () => {
    if (deleteTarget === "orders") {
      deleteSelectedOrders()
    } else {
      deleteSelectedHistory()
    }
  }

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
                <div className="flex items-center gap-3">
                  {selectedOrders.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog("orders")}
                      disabled={isDeleting}
                    >
                      <Trash2 className="size-4 mr-1" />
                      {selectedOrders.size}件を削除
                    </Button>
                  )}
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                          onCheckedChange={toggleAllOrders}
                        />
                      </TableHead>
                      <TableHead>発注番号</TableHead>
                      <TableHead>店舗</TableHead>
                      <TableHead>発注日</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>完了日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow 
                        key={order.id}
                        className={selectedOrders.has(order.id) ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                        </TableCell>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">在庫変動履歴</CardTitle>
                {selectedHistory.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog("history")}
                    disabled={isDeleting}
                  >
                    <Trash2 className="size-4 mr-1" />
                    {selectedHistory.size}件を削除
                  </Button>
                )}
              </div>
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedHistory.size === inventoryHistory.length && inventoryHistory.length > 0}
                          onCheckedChange={toggleAllHistory}
                        />
                      </TableHead>
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
                      <TableRow 
                        key={history.id}
                        className={selectedHistory.has(history.id) ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedHistory.has(history.id)}
                            onCheckedChange={() => toggleHistorySelection(history.id)}
                          />
                        </TableCell>
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

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === "orders" ? (
                <>
                  選択した {selectedOrders.size} 件の発注を削除しますか？
                  <br />
                  関連する発注明細も一緒に削除されます。この操作は取り消せません。
                </>
              ) : (
                <>
                  選択した {selectedHistory.size} 件の在庫履歴を削除しますか？
                  <br />
                  この操作は取り消せません。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="size-4 mr-1" />
              )}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
