"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Eye, Check, Printer, Package, Loader2, Trash2 } from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Order, OrderItem, Store, Staff, Product, HqInventory } from "@/types/database"

type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

type OrderWithDetails = Order & {
  stores: Store | null
  staff: Staff | null
  order_items: (OrderItem & {
    products: (Product & {
      hq_inventory: HqInventory | null
    }) | null
  })[]
}

type ProductWithInventory = Product & {
  hq_inventory: HqInventory | null
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [products, setProducts] = useState<ProductWithInventory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newOrderStoreId, setNewOrderStoreId] = useState("")
  const [newOrderStaffId, setNewOrderStaffId] = useState("")
  const [orderItems, setOrderItems] = useState<{ product_id: string; quantity: number }[]>([])

  const supabase = createClient()

  const fetchData = async () => {
    setIsLoading(true)

    const [ordersRes, storesRes, staffRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select(`
          *,
          stores (*),
          staff (*),
          order_items (
            *,
            products (
              *,
              hq_inventory (*)
            )
          )
        `)
        .order("created_at", { ascending: false }),
      supabase.from("stores").select("*").eq("is_active", true).order("store_name"),
      supabase.from("staff").select("*").eq("is_active", true).order("name"),
      supabase
        .from("products")
        .select(`*, hq_inventory (*)`)
        .eq("is_active", true)
        .order("product_name"),
    ])

    if (ordersRes.data) {
      setOrders(ordersRes.data as OrderWithDetails[])
    }
    if (storesRes.data) {
      setStores(storesRes.data)
    }
    if (staffRes.data) {
      setStaffList(staffRes.data)
    }
    if (productsRes.data) {
      setProducts(productsRes.data as ProductWithInventory[])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.stores?.store_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = orders.filter(o => o.status === "pending").length
  const processingCount = orders.filter(o => o.status === "processing").length

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">未処理</Badge>
      case "processing":
        return <Badge variant="default">処理中</Badge>
      case "completed":
        return <Badge variant="success">完了</Badge>
      case "cancelled":
        return <Badge variant="secondary">キャンセル</Badge>
    }
  }

  const handleViewOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setIsDetailDialogOpen(true)
  }

  const handleProcessOrder = async (order: OrderWithDetails) => {
    setIsSaving(true)

    // Auto-assign staff based on product types and HQ stock
    const hasExtension = order.order_items.some(item =>
      item.products?.product_code?.startsWith("EXT")
    )
    const allHaveHqStock = order.order_items.every(item => {
      const hqStock = item.products?.hq_inventory?.quantity ?? 0
      return hqStock >= item.quantity
    })

    // Find staff by name pattern (浅野 for HQ stock, 金本 for supplier orders on extensions)
    let assignedStaffId: string | null = null
    if (hasExtension && !allHaveHqStock) {
      const kanemoto = staffList.find(s => s.name.includes("金本"))
      assignedStaffId = kanemoto?.id || staffList[0]?.id || null
    } else {
      const asano = staffList.find(s => s.name.includes("浅野"))
      assignedStaffId = asano?.id || staffList[0]?.id || null
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "processing",
        assigned_staff_id: assignedStaffId,
        assignment_type: "auto",
      })
      .eq("id", order.id)

    if (error) {
      console.error("Error processing order:", error)
      alert("処理開始に失敗しました")
      setIsSaving(false)
      return // エラー時は明細更新をスキップ
    }

    // Update order items with fulfillment source
    for (const item of order.order_items) {
      const hqStock = item.products?.hq_inventory?.quantity ?? 0
      const fulfilledFrom = hqStock >= item.quantity ? "hq" : "supplier"

      await supabase
        .from("order_items")
        .update({ fulfilled_from: fulfilledFrom })
        .eq("id", item.id)
    }

    setIsSaving(false)
    fetchData()
  }

  const handleCompleteOrder = async (order: OrderWithDetails) => {
    setIsSaving(true)

    // Deduct from HQ inventory for items fulfilled from HQ
    for (const item of order.order_items) {
      if (item.fulfilled_from === "hq" && item.products?.hq_inventory) {
        const newQuantity = Math.max(0, item.products.hq_inventory.quantity - item.quantity)
        await supabase
          .from("hq_inventory")
          .update({ quantity: newQuantity })
          .eq("id", item.products.hq_inventory.id)

        // Record inventory history
        await supabase.from("inventory_history").insert({
          product_id: item.product_id,
          change_type: "out",
          quantity: -item.quantity,
          previous_quantity: item.products.hq_inventory.quantity,
          new_quantity: newQuantity,
          reason: `発注完了: ${order.order_number}`,
        })
      }
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", order.id)

    if (error) {
      console.error("Error completing order:", error)
      alert("完了処理に失敗しました")
    }

    setIsSaving(false)
    setIsDetailDialogOpen(false)
    fetchData()
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrderStoreId || orderItems.length === 0) return

    setIsSaving(true)

    // "auto" の場合は null として扱う（自動割当は処理開始時に行う）
    const staffId = newOrderStaffId && newOrderStaffId !== "auto" ? newOrderStaffId : null

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: newOrderStoreId,
        assigned_staff_id: staffId,
        assignment_type: staffId ? "manual" : null,
        status: "pending",
      })
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error("Error creating order:", orderError)
      alert("発注作成に失敗しました")
      setIsSaving(false)
      return
    }

    // Insert order items
    const itemsToInsert = orderItems.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      // 明細挿入失敗時は注文も削除してロールバック
      const { error: deleteError } = await supabase.from("orders").delete().eq("id", newOrder.id)
      if (deleteError) {
        // 削除も失敗した場合はログに残す（要手動対応）
        console.error("Critical: Failed to rollback order:", deleteError, "Order ID:", newOrder.id)
        alert(`発注明細の作成に失敗しました。注文ID: ${newOrder.id} の手動削除が必要です。`)
      } else {
        alert("発注明細の作成に失敗しました。発注はキャンセルされました。")
      }
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    setIsNewOrderDialogOpen(false)
    setNewOrderStoreId("")
    setNewOrderStaffId("")
    setOrderItems([])
    fetchData()
  }

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: 1 }])
  }

  const handleRemoveOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">発注管理</h1>
          <p className="text-muted-foreground text-pretty">
            店舗からの発注を確認・処理します
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="size-4" />
            印刷
          </Button>
          <Button onClick={() => setIsNewOrderDialogOpen(true)}>
            <Plus className="size-4" />
            新規発注
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 no-print">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">未処理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-yellow-600">{pendingCount}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">処理中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-blue-600">{processingCount}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">本日完了</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-green-600">
              {orders.filter(o => o.status === "completed" && o.completed_at &&
                new Date(o.completed_at).toDateString() === new Date().toDateString()).length}件
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="no-print">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="発注番号・店舗名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="ステータスで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="pending">未処理</SelectItem>
                <SelectItem value="processing">処理中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
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
              <p className="text-sm">
                {orders.length === 0
                  ? "発注がありません。「新規発注」から発注を追加してください。"
                  : "検索条件に一致する発注がありません。"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>発注番号</TableHead>
                  <TableHead>店舗</TableHead>
                  <TableHead>商品数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead>発注日</TableHead>
                  <TableHead className="w-32 no-print">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell className="font-medium">{order.stores?.store_name || "-"}</TableCell>
                    <TableCell className="tabular-nums">{order.order_items.length}点</TableCell>
                    <TableCell>{getStatusBadge(order.status as OrderStatus)}</TableCell>
                    <TableCell>
                      {order.staff ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">{order.staff.name}</Badge>
                          {order.assignment_type === "auto" && (
                            <span className="text-xs text-muted-foreground">(自動)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatDate(order.created_at)}</TableCell>
                    <TableCell className="no-print">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewOrder(order)}
                          aria-label="詳細"
                        >
                          <Eye className="size-4" />
                        </Button>
                        {order.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessOrder(order)}
                            disabled={isSaving}
                          >
                            <Package className="size-3" />
                            処理開始
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>発注詳細</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number} - {selectedOrder?.stores?.store_name}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">ステータス</p>
                  <p className="font-medium">{getStatusBadge(selectedOrder.status as OrderStatus)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">担当者</p>
                  <p className="font-medium">{selectedOrder.staff?.name || "未割当"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">発注日時</p>
                  <p className="font-medium tabular-nums">{formatDateTime(selectedOrder.created_at)}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">発注明細</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品コード</TableHead>
                      <TableHead>商品名</TableHead>
                      <TableHead className="text-right tabular-nums">数量</TableHead>
                      <TableHead className="text-right tabular-nums">本部在庫</TableHead>
                      <TableHead>供給元</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.order_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.products?.product_code || "-"}
                        </TableCell>
                        <TableCell>{item.products?.product_name || "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.products?.hq_inventory?.quantity ?? 0}
                        </TableCell>
                        <TableCell>
                          {item.fulfilled_from === "hq" ? (
                            <Badge variant="success">本部在庫</Badge>
                          ) : item.fulfilled_from === "supplier" ? (
                            <Badge variant="warning">仕入れ先</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedOrder.status === "processing" && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                    閉じる
                  </Button>
                  <Button onClick={() => handleCompleteOrder(selectedOrder)} disabled={isSaving}>
                    {isSaving && <Loader2 className="size-4 animate-spin" />}
                    <Check className="size-4" />
                    完了にする
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新規発注</DialogTitle>
            <DialogDescription>
              店舗からの発注を手動で登録します
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>店舗 *</Label>
                <Select value={newOrderStoreId} onValueChange={setNewOrderStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="店舗を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.store_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>担当者</Label>
                <Select value={newOrderStaffId || "auto"} onValueChange={(v) => setNewOrderStaffId(v === "auto" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="自動割当" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自動割当（処理開始時に決定）</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>発注明細 *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddOrderItem}>
                  <Plus className="size-3" />
                  商品追加
                </Button>
              </div>
              {orderItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  「商品追加」ボタンで商品を追加してください
                </p>
              ) : (
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => {
                          const newItems = [...orderItems]
                          newItems[index].product_id = value
                          setOrderItems(newItems)
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="商品を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.product_code} - {product.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...orderItems]
                          newItems[index].quantity = parseInt(e.target.value) || 1
                          setOrderItems(newItems)
                        }}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOrderItem(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewOrderDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !newOrderStoreId || orderItems.length === 0 || orderItems.some(i => !i.product_id)}
              >
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                作成
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
