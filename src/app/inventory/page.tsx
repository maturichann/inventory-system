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
import { Search, Plus, Minus, AlertTriangle, Printer, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Product, Category, HqInventory } from "@/types/database"

type InventoryItem = Product & {
  hq_inventory: HqInventory | null
  categories: Category | null
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustType, setAdjustType] = useState<"in" | "out" | "adjust">("in")
  const [adjustQuantity, setAdjustQuantity] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const fetchInventory = async () => {
    setIsLoading(true)

    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select(`
          *,
          hq_inventory (*),
          categories (*)
        `)
        .eq("is_active", true)
        .order("product_name"),
      supabase.from("categories").select("*").order("sort_order"),
    ])

    if (productsRes.data) {
      setInventory(productsRes.data as InventoryItem[])
    }
    if (categoriesRes.data) {
      setCategories(categoriesRes.data)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product_code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory
    const quantity = item.hq_inventory?.quantity ?? 0
    const threshold = item.hq_inventory?.threshold ?? 5
    const matchesLowStock = !showLowStockOnly || quantity <= threshold
    return matchesSearch && matchesCategory && matchesLowStock
  })

  const lowStockCount = inventory.filter(item => {
    const quantity = item.hq_inventory?.quantity ?? 0
    const threshold = item.hq_inventory?.threshold ?? 5
    return quantity <= threshold
  }).length

  const totalStock = inventory.reduce((sum, item) => sum + (item.hq_inventory?.quantity ?? 0), 0)

  const handleOpenAdjustDialog = (item: InventoryItem, type: "in" | "out" | "adjust") => {
    setSelectedItem(item)
    setAdjustType(type)
    setAdjustQuantity("")
    setAdjustReason("")
    setIsAdjustDialogOpen(true)
  }

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    const qty = parseInt(adjustQuantity)
    if (isNaN(qty) || qty <= 0) return

    setIsSaving(true)

    const currentQuantity = selectedItem.hq_inventory?.quantity ?? 0
    let newQuantity = currentQuantity

    if (adjustType === "in") {
      newQuantity = currentQuantity + qty
    } else if (adjustType === "out") {
      newQuantity = Math.max(0, currentQuantity - qty)
    } else {
      newQuantity = qty
    }

    if (selectedItem.hq_inventory) {
      const { error } = await supabase
        .from("hq_inventory")
        .update({ quantity: newQuantity })
        .eq("id", selectedItem.hq_inventory.id)

      if (error) {
        console.error("Error updating inventory:", error)
        alert("在庫の更新に失敗しました")
        setIsSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from("hq_inventory")
        .insert({
          product_id: selectedItem.id,
          quantity: newQuantity,
          threshold: 5,
        })

      if (error) {
        console.error("Error creating inventory:", error)
        alert("在庫の作成に失敗しました")
        setIsSaving(false)
        return
      }
    }

    // 在庫更新成功時のみ履歴を記録
    const { error: historyError } = await supabase.from("inventory_history").insert({
      product_id: selectedItem.id,
      change_type: adjustType,
      quantity: adjustType === "adjust" ? newQuantity - currentQuantity : (adjustType === "in" ? qty : -qty),
      previous_quantity: currentQuantity,
      new_quantity: newQuantity,
      reason: adjustReason || null,
    })

    if (historyError) {
      console.error("Error recording history:", historyError)
      // 在庫は更新済みなので警告のみ
    }

    setIsSaving(false)
    setIsAdjustDialogOpen(false)
    fetchInventory()
  }

  const handlePrint = () => {
    window.print()
  }

  const getStockBadge = (quantity: number, threshold: number) => {
    if (quantity <= threshold) {
      return <Badge variant="destructive">要発注</Badge>
    }
    if (quantity <= threshold * 1.5) {
      return <Badge variant="warning">注意</Badge>
    }
    return <Badge variant="success">在庫あり</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">本部在庫管理</h1>
          <p className="text-muted-foreground text-pretty">
            本部在庫の確認・入出庫・調整を行います
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="size-4" />
            印刷
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 no-print">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総在庫点数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{inventory.length}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総在庫数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {totalStock.toLocaleString()}個
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-destructive" />
              在庫アラート
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-destructive">{lowStockCount}件</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="no-print">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="商品名・商品コードで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="カテゴリで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのカテゴリ</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showLowStockOnly ? "default" : "outline"}
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            >
              <AlertTriangle className="size-4" />
              アラートのみ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <p className="text-sm">
                {inventory.length === 0
                  ? "在庫データがありません。商品マスターに商品を登録してください。"
                  : "検索条件に一致する商品がありません。"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品コード</TableHead>
                  <TableHead>商品名</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead className="text-right tabular-nums">在庫数</TableHead>
                  <TableHead className="text-right tabular-nums">閾値</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="w-32 no-print">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const quantity = item.hq_inventory?.quantity ?? 0
                  const threshold = item.hq_inventory?.threshold ?? 5
                  return (
                    <TableRow key={item.id} className={quantity <= threshold ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-sm">{item.product_code}</TableCell>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.categories?.name || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {threshold}
                      </TableCell>
                      <TableCell>{getStockBadge(quantity, threshold)}</TableCell>
                      <TableCell className="no-print">
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAdjustDialog(item, "in")}
                            aria-label="入庫"
                          >
                            <Plus className="size-3" />
                            入庫
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAdjustDialog(item, "out")}
                            aria-label="出庫"
                          >
                            <Minus className="size-3" />
                            出庫
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustType === "in" ? "入庫" : adjustType === "out" ? "出庫" : "在庫調整"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            {selectedItem && (
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium">{selectedItem.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  現在の在庫: {selectedItem.hq_inventory?.quantity ?? 0}個
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {adjustType === "adjust" ? "調整後の数量" : "数量"} *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">理由</Label>
              <Input
                id="reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder={
                  adjustType === "in"
                    ? "例：仕入れ入荷"
                    : adjustType === "out"
                    ? "例：店舗発注対応"
                    : "例：棚卸し調整"
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {adjustType === "in" ? "入庫する" : adjustType === "out" ? "出庫する" : "調整する"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
