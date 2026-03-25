"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Pencil, Trash2, Loader2, Package, ChevronDown, ChevronRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import type { Product, Category, Maker, Staff } from "@/types/database"

type ProductFormData = {
  product_code: string
  product_name: string
  category_id: string
  maker_id: string
  level1: string
  level2: string
  level3: string
  level4: string
  level5: string
  level6: string
  level7: string
  level8: string
  unit_price: string
  cost_price: string
  supplier: string
  assigned_staff_id: string
  notes: string
  track_hq_inventory: boolean
}

const initialFormData: ProductFormData = {
  product_code: "",
  product_name: "",
  category_id: "",
  maker_id: "",
  level1: "",
  level2: "",
  level3: "",
  level4: "",
  level5: "",
  level6: "",
  level7: "",
  level8: "",
  unit_price: "",
  cost_price: "",
  supplier: "",
  assigned_staff_id: "",
  notes: "",
  track_hq_inventory: false,
}

// エクステ商品ライン判定（商品名から）
function getExtensionLine(name: string): string | null {
  if (name.match(/^NUMEROフラットラッシュ/)) return "NUMEROフラットラッシュ"
  if (name.match(/^ボリュームラッシュリュクス/)) return "ボリュームラッシュリュクス0.07"
  if (name.match(/^ベルシアエクステ.*フラットブラウン/)) return "ベルシアエクステ（フラットブラウン）"
  if (name.match(/^ベルシアエクステ.*フラットラッシュ/)) return "ベルシアエクステ（フラットラッシュ）"
  return null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [makers, setMakers] = useState<Maker[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedMaker, setSelectedMaker] = useState<string>("all")
  const [isSaving, setIsSaving] = useState(false)
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set())

  const supabase = createClient()

  const fetchData = async () => {
    setIsLoading(true)

    const [productsRes, categoriesRes, makersRes, staffRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("makers").select("*").eq("is_active", true).order("maker_name"),
      supabase.from("staff").select("*").eq("is_active", true).order("name"),
    ])

    if (productsRes.data) setProducts(productsRes.data)
    if (categoriesRes.data) setCategories(categoriesRes.data)
    if (makersRes.data) setMakers(makersRes.data)
    if (staffRes.data) setStaffList(staffRes.data)

    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        product_code: product.product_code,
        product_name: product.product_name,
        category_id: product.category_id || "",
        maker_id: product.maker_id || "",
        level1: product.level1 || "",
        level2: product.level2 || "",
        level3: product.level3 || "",
        level4: product.level4 || "",
        level5: product.level5 || "",
        level6: product.level6 || "",
        level7: product.level7 || "",
        level8: product.level8 || "",
        unit_price: product.unit_price?.toString() || "",
        cost_price: product.cost_price?.toString() || "",
        supplier: product.supplier || "",
        assigned_staff_id: product.assigned_staff_id || "",
        notes: product.notes || "",
        track_hq_inventory: product.track_hq_inventory ?? true,
      })
    } else {
      setEditingProduct(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const productData = {
      product_code: formData.product_code,
      product_name: formData.product_name,
      category_id: formData.category_id || null,
      maker_id: formData.maker_id || null,
      level1: formData.level1 || null,
      level2: formData.level2 || null,
      level3: formData.level3 || null,
      level4: formData.level4 || null,
      level5: formData.level5 || null,
      level6: formData.level6 || null,
      level7: formData.level7 || null,
      level8: formData.level8 || null,
      unit_price: parseFloat(formData.unit_price) || 0,
      cost_price: parseFloat(formData.cost_price) || 0,
      supplier: formData.supplier || null,
      assigned_staff_id: formData.assigned_staff_id || null,
      notes: formData.notes || null,
      track_hq_inventory: formData.track_hq_inventory,
    }

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id)

      if (error) {
        console.error("Error updating product:", error)
        alert("更新に失敗しました")
      }
    } else {
      const { error } = await supabase
        .from("products")
        .insert(productData)

      if (error) {
        console.error("Error creating product:", error)
        alert("登録に失敗しました")
      }
    }

    setIsSaving(false)
    handleCloseDialog()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("この商品を削除しますか？")) {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting product:", error)
        alert("削除に失敗しました")
      } else {
        fetchData()
      }
    }
  }

  // 選択中のカテゴリがエクステかどうか
  const isExtensionCategory = useMemo(() => {
    if (selectedCategory === "all") return false
    const cat = categories.find(c => c.id === selectedCategory)
    return cat?.is_extension === true
  }, [selectedCategory, categories])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory
    const matchesMaker = selectedMaker === "all" || product.maker_id === selectedMaker
    return matchesSearch && matchesCategory && matchesMaker
  })

  // エクステカテゴリの場合、商品ラインでグループ化
  const { lineGroups, singleProducts } = useMemo(() => {
    if (!isExtensionCategory || searchQuery) {
      return { lineGroups: [], singleProducts: filteredProducts }
    }

    const groups: Record<string, Product[]> = {}
    const singles: Product[] = []

    for (const p of filteredProducts) {
      const line = getExtensionLine(p.product_name)
      if (line) {
        if (!groups[line]) groups[line] = []
        groups[line].push(p)
      } else {
        singles.push(p)
      }
    }

    const lineArr = Object.entries(groups)
      .filter(([, prods]) => prods.length > 1)
      .map(([name, prods]) => ({ name, products: prods }))
      .sort((a, b) => a.name.localeCompare(b.name, "ja"))

    // 1商品のグループは単品扱い
    for (const [, prods] of Object.entries(groups)) {
      if (prods.length === 1) singles.push(prods[0])
    }

    return { lineGroups: lineArr, singleProducts: singles }
  }, [isExtensionCategory, filteredProducts, searchQuery])

  const toggleLine = (lineName: string) => {
    const newExpanded = new Set(expandedLines)
    if (newExpanded.has(lineName)) {
      newExpanded.delete(lineName)
    } else {
      newExpanded.add(lineName)
    }
    setExpandedLines(newExpanded)
  }

  const getCategoryName = (categoryId: string | null) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || "-"
  }

  const getMakerName = (makerId: string | null) => {
    const maker = makers.find(m => m.id === makerId)
    return maker?.maker_name || "-"
  }

  const getStaffName = (staffId: string | null) => {
    const staff = staffList.find(s => s.id === staffId)
    return staff?.name || "-"
  }

  const renderProductRow = (product: Product) => (
    <TableRow key={product.id}>
      <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{product.product_name}</div>
          {product.level1 && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {[product.level1, product.level2, product.level3]
                .filter(Boolean)
                .join(" > ")}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{getCategoryName(product.category_id)}</Badge>
      </TableCell>
      <TableCell>{getMakerName(product.maker_id)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {product.unit_price.toLocaleString()}円
      </TableCell>
      <TableCell>
        {product.track_hq_inventory ? (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <Package className="mr-1 size-3" />
            管理
          </Badge>
        ) : (
          <Badge variant="secondary">仕入先</Badge>
        )}
      </TableCell>
      <TableCell>
        {product.assigned_staff_id ? (
          <Badge variant="outline">{getStaffName(product.assigned_staff_id)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog(product)}
            aria-label="編集"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(product.id)}
            aria-label="削除"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">商品マスター</h1>
          <p className="text-muted-foreground text-pretty">
            商品の登録・編集・削除を行います
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          新規登録
        </Button>
      </div>

      <Card>
        <CardHeader>
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
            <Select value={selectedMaker} onValueChange={setSelectedMaker}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="メーカーで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのメーカー</SelectItem>
                {makers.map((maker) => (
                  <SelectItem key={maker.id} value={maker.id}>
                    {maker.maker_name}
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
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <p className="text-sm">
                {products.length === 0
                  ? "商品が登録されていません。「新規登録」から商品を追加してください。"
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
                  <TableHead>メーカー</TableHead>
                  <TableHead className="text-right tabular-nums">単価</TableHead>
                  <TableHead>本部在庫</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* エクステ商品ライングループ */}
                {lineGroups.map((group) => (
                  <>
                    <TableRow
                      key={`line-${group.name}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleLine(group.name)}
                    >
                      <TableCell colSpan={2}>
                        <div className="flex items-center gap-2">
                          {expandedLines.has(group.name) ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                          <span className="font-medium">{group.name}</span>
                          <Badge variant="secondary">{group.products.length}件</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">エクステ</Badge>
                      </TableCell>
                      <TableCell>{getMakerName(group.products[0].maker_id)}</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell />
                    </TableRow>
                    {expandedLines.has(group.name) &&
                      group.products.map(renderProductRow)
                    }
                  </>
                ))}
                {/* 単品商品 */}
                {singleProducts.map(renderProductRow)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "商品を編集" : "新規商品登録"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product_code">商品コード *</Label>
                <Input
                  id="product_code"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_name">商品名 *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category_id">カテゴリ</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maker_id">メーカー</Label>
                <Select
                  value={formData.maker_id}
                  onValueChange={(value) => setFormData({ ...formData, maker_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {makers.map((maker) => (
                      <SelectItem key={maker.id} value={maker.id}>
                        {maker.maker_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>階層分類（任意）</Label>
              <div className="grid gap-2 sm:grid-cols-4">
                <Input
                  placeholder="第1階層"
                  value={formData.level1}
                  onChange={(e) => setFormData({ ...formData, level1: e.target.value })}
                />
                <Input
                  placeholder="第2階層"
                  value={formData.level2}
                  onChange={(e) => setFormData({ ...formData, level2: e.target.value })}
                />
                <Input
                  placeholder="第3階層"
                  value={formData.level3}
                  onChange={(e) => setFormData({ ...formData, level3: e.target.value })}
                />
                <Input
                  placeholder="第4階層"
                  value={formData.level4}
                  onChange={(e) => setFormData({ ...formData, level4: e.target.value })}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                <Input
                  placeholder="第5階層"
                  value={formData.level5}
                  onChange={(e) => setFormData({ ...formData, level5: e.target.value })}
                />
                <Input
                  placeholder="第6階層"
                  value={formData.level6}
                  onChange={(e) => setFormData({ ...formData, level6: e.target.value })}
                />
                <Input
                  placeholder="第7階層"
                  value={formData.level7}
                  onChange={(e) => setFormData({ ...formData, level7: e.target.value })}
                />
                <Input
                  placeholder="第8階層"
                  value={formData.level8}
                  onChange={(e) => setFormData({ ...formData, level8: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="unit_price">単価（円）</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_price">原価（円）</Label>
                <Input
                  id="cost_price"
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">仕入れ先</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_staff_id">担当者（ラベル）</Label>
              <Select
                value={formData.assigned_staff_id}
                onValueChange={(value) => setFormData({ ...formData, assigned_staff_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">メモ</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2 rounded-md border p-3">
              <Checkbox
                id="track_hq_inventory"
                checked={formData.track_hq_inventory}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, track_hq_inventory: checked === true })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="track_hq_inventory"
                  className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <Package className="size-4" />
                  本部在庫で管理
                </Label>
                <p className="text-xs text-muted-foreground">
                  チェックを外すと本部在庫画面に表示されず、常に仕入先対応となります
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {editingProduct ? "更新" : "登録"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
