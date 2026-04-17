"use client"

import { useState, useEffect, use, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, ShoppingCart, Loader2, Check, Search, History, ChevronDown, ChevronRight, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Store, Product, Category, Maker } from "@/types/database"

type ProductWithCategory = Product & {
  categories: Category | null
  makers: Pick<Maker, "id" | "maker_name" | "minimum_order"> | null
}

type CartItem = {
  product_id: string
  product_code: string
  product_name: string
  category_name: string
  quantity: number
  notes: string
}

type OrderHistory = {
  id: string
  order_number: string
  status: string
  created_at: string
  items: {
    product_name: string
    product_code: string
    quantity: number
    notes: string | null
  }[]
}

type MinimumOrderViolation = {
  makerId: string
  makerName: string
  minimumOrder: number
  currentTotal: number
  shortage: number
}

// エクステ商品の解析結果
type ParsedExtProduct = {
  product: ProductWithCategory
  line: string
  attributes: Record<string, string>
}

// 商品ラインごとの属性表示順
const LINE_ATTRIBUTE_ORDER: Record<string, string[]> = {
  "NUMEROフラットラッシュ": ["カール", "長さ", "カラー"],
  "ボリュームラッシュリュクス": ["カール", "長さ"],
  "ベルシアエクステ（フラットラッシュ）": ["カール", "太さ", "長さ"],
  "ベルシアエクステ（フラットブラウン）": ["カール", "長さ"],
}

// 商品名からエクステ属性を解析
function parseExtensionProduct(product: ProductWithCategory): ParsedExtProduct | null {
  const name = product.product_name

  // NUMEROフラットラッシュ: "NUMEROフラットラッシュマットカラー長さMIX SCカール カラー名"
  const numeroMatch = name.match(/^NUMEROフラットラッシュ.*長さ(\S+)\s+(\S+)カール\s+(.+)$/)
  if (numeroMatch) {
    return {
      product,
      line: "NUMEROフラットラッシュ",
      attributes: {
        "カール": numeroMatch[2],
        "長さ": numeroMatch[1],
        "カラー": numeroMatch[3],
      },
    }
  }

  // ボリュームラッシュリュクス: "ボリュームラッシュリュクス CCカール 06mm"
  const volMatch = name.match(/^ボリュームラッシュリュクス[\d.]+\s+(\S+)カール\s+(\d+)mm$/)
  if (volMatch) {
    return {
      product,
      line: "ボリュームラッシュリュクス",
      attributes: {
        "カール": volMatch[1],
        "長さ": volMatch[2] + "mm",
      },
    }
  }

  // ベルシアエクステ（フラットブラウン）: "ベルシアエクステ フラットブラウン Jカール 0.15 8mm" etc
  const belBrownMatch = name.match(/^ベルシアエクステ.*フラットブラウン.*?(\S+)カール\s+[\d.]+\s+(\d+)mm$/)
  if (belBrownMatch) {
    return {
      product,
      line: "ベルシアエクステ（フラットブラウン）",
      attributes: {
        "カール": belBrownMatch[1],
        "長さ": belBrownMatch[2] + "mm",
      },
    }
  }

  // ベルシアエクステ（フラットラッシュ）: "ベルシアエクステ フラットラッシュ Cカール 0.15 10mm" etc
  const belFlatMatch = name.match(/^ベルシアエクステ.*フラットラッシュ.*?(\S+)カール\s+([\d.]+)\s+(\d+)mm$/)
  if (belFlatMatch) {
    return {
      product,
      line: "ベルシアエクステ（フラットラッシュ）",
      attributes: {
        "カール": belFlatMatch[1],
        "太さ": belFlatMatch[2],
        "長さ": belFlatMatch[3] + "mm",
      },
    }
  }

  return null
}

// 商品ラインの情報
type ExtensionLine = {
  name: string
  parsedProducts: ParsedExtProduct[]
  attributeOrder: string[]
}

export default function StoreOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [orderItems, setOrderItems] = useState<CartItem[]>([])
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isMinimumOrderDialogOpen, setIsMinimumOrderDialogOpen] = useState(false)
  const [minimumOrderViolations, setMinimumOrderViolations] = useState<MinimumOrderViolation[]>([])
  const [orderNumber, setOrderNumber] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [notFound, setNotFound] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("order")

  // エクステ階層選択用
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [lineSelections, setLineSelections] = useState<Record<string, string>>({})

  const supabase = createClient()

  const fetchOrderHistory = async (storeId: string) => {
    setIsLoadingHistory(true)

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        created_at,
        order_items (
          quantity,
          notes,
          products (
            product_name,
            product_code
          )
        )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching order history:", error)
      setIsLoadingHistory(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history: OrderHistory[] = (ordersData || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      created_at: order.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (order.order_items || []).map((item: any) => ({
        product_name: item.products?.product_name || "",
        product_code: item.products?.product_code || "",
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    }))

    setOrderHistory(history)
    setIsLoadingHistory(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("store_code", code)
        .eq("is_active", true)
        .single()

      if (storeError || !storeData) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      setStore(storeData)

      const { data: productsData } = await supabase
        .from("products")
        .select(`
          *,
          categories (*),
          makers (
            id,
            maker_name,
            minimum_order
          )
        `)
        .eq("is_active", true)
        .order("product_name")

      if (productsData) {
        setProducts(productsData as ProductWithCategory[])
      }

      setIsLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  useEffect(() => {
    if (activeTab === "history" && store && orderHistory.length === 0) {
      fetchOrderHistory(store.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, store])

  const categories = [...new Set(products.map(p => p.categories?.name).filter(Boolean))]

  // エクステカテゴリ判定
  const selectedCategoryObj = useMemo(() => {
    if (selectedCategory === "all") return null
    return products.find(p => p.categories?.name === selectedCategory)?.categories || null
  }, [selectedCategory, products])

  const isExtensionCategory = selectedCategoryObj?.is_extension === true

  // エクステ商品を商品ラインと単品に分類
  const { extensionLines, singleExtProducts } = useMemo(() => {
    if (!isExtensionCategory) return { extensionLines: [], singleExtProducts: [] }

    const extProducts = products.filter(p => p.categories?.name === selectedCategory)
    const lineMap: Record<string, ParsedExtProduct[]> = {}
    const singles: ProductWithCategory[] = []

    for (const p of extProducts) {
      const parsed = parseExtensionProduct(p)
      if (parsed) {
        if (!lineMap[parsed.line]) lineMap[parsed.line] = []
        lineMap[parsed.line].push(parsed)
      } else {
        singles.push(p)
      }
    }

    const lines: ExtensionLine[] = Object.entries(lineMap)
      .filter(([, prods]) => prods.length > 1)
      .map(([name, prods]) => ({
        name,
        parsedProducts: prods,
        attributeOrder: LINE_ATTRIBUTE_ORDER[name] || Object.keys(prods[0].attributes),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "ja"))

    // 1商品しかないグループは単品扱い
    for (const [, prods] of Object.entries(lineMap)) {
      if (prods.length === 1) {
        singles.push(prods[0].product)
      }
    }

    return { extensionLines: lines, singleExtProducts: singles }
  }, [isExtensionCategory, selectedCategory, products])

  // 選択中のラインで、現在の選択に基づいてフィルタリング
  const currentLineData = useMemo(() => {
    if (!selectedLine) return null
    const line = extensionLines.find(l => l.name === selectedLine)
    if (!line) return null

    // 各属性の選択肢を計算（上位の選択で絞り込み）
    const availableOptions: { key: string; values: string[] }[] = []
    let filteredProducts = line.parsedProducts

    for (const attrKey of line.attributeOrder) {
      const values = [...new Set(filteredProducts.map(p => p.attributes[attrKey]).filter(Boolean))].sort()
      availableOptions.push({ key: attrKey, values })

      const selected = lineSelections[attrKey]
      if (selected) {
        filteredProducts = filteredProducts.filter(p => p.attributes[attrKey] === selected)
      } else {
        break // 未選択の属性以降は表示しない
      }
    }

    // 全属性選択済みかチェック
    const allSelected = line.attributeOrder.every(key => lineSelections[key])
    const matchedProduct = allSelected && filteredProducts.length === 1 ? filteredProducts[0].product : null

    return { line, availableOptions, matchedProduct }
  }, [selectedLine, extensionLines, lineSelections])

  // カテゴリ・ライン変更時のリセット
  useEffect(() => {
    setSelectedLine(null)
    setLineSelections({})
  }, [selectedCategory])

  // 通常商品のフィルタリング（エクステ以外）
  const filteredProducts = useMemo(() => {
    if (isExtensionCategory) return [] // エクステは専用UIで表示
    return products.filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.categories?.name === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory, isExtensionCategory])

  // エクステ単品のフィルタリング（検索対応）
  const filteredSingleExtProducts = useMemo(() => {
    if (!isExtensionCategory) return []
    return singleExtProducts.filter(p =>
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [isExtensionCategory, singleExtProducts, searchQuery])

  const handleAddProduct = (product: ProductWithCategory) => {
    if (orderItems.some(item => item.product_id === product.id)) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
      return
    }

    setOrderItems([...orderItems, {
      product_id: product.id,
      product_code: product.product_code,
      product_name: product.product_name,
      category_name: product.categories?.name || "-",
      quantity: 1,
      notes: "",
    }])
  }

  const handleAddExtProduct = (product: ProductWithCategory) => {
    handleAddProduct(product)
    // 選択をリセットして次の選択に備える
    setSelectedLine(null)
    setLineSelections({})
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId)
      return
    }
    setOrderItems(orderItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity }
        : item
    ))
  }

  const handleUpdateNotes = (productId: string, notes: string) => {
    setOrderItems(orderItems.map(item =>
      item.product_id === productId
        ? { ...item, notes }
        : item
    ))
  }

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId))
  }

  const handleSubmitOrder = async () => {
    if (!store || orderItems.length === 0) return

    for (const item of orderItems) {
      if (item.quantity < 1 || item.quantity > 99999) {
        alert("数量は1〜99999の範囲で入力してください")
        return
      }
    }

    const productMap = new Map(products.map(product => [product.id, product]))
    const makerTotals = new Map<string, MinimumOrderViolation>()

    for (const item of orderItems) {
      const product = productMap.get(item.product_id)
      const maker = product?.makers

      if (!product || !maker || maker.minimum_order <= 0) {
        continue
      }

      const current = makerTotals.get(maker.id)
      const lineTotal = product.cost_price * item.quantity

      if (current) {
        current.currentTotal += lineTotal
        current.shortage = Math.max(current.minimumOrder - current.currentTotal, 0)
        continue
      }

      makerTotals.set(maker.id, {
        makerId: maker.id,
        makerName: maker.maker_name,
        minimumOrder: maker.minimum_order,
        currentTotal: lineTotal,
        shortage: Math.max(maker.minimum_order - lineTotal, 0),
      })
    }

    const violations = Array.from(makerTotals.values())
      .filter(maker => maker.currentTotal < maker.minimumOrder)
      .sort((a, b) => a.makerName.localeCompare(b.makerName, "ja"))

    if (violations.length > 0) {
      setMinimumOrderViolations(violations)
      setIsMinimumOrderDialogOpen(true)
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase.rpc("create_order_with_items", {
      p_store_id: store.id,
      p_items: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    })

    if (error) {
      console.error("Error creating order:", error)
      alert("発注の送信に失敗しました")
      setIsSubmitting(false)
      return
    }

    const result = data as { success: boolean; error?: string; order_number?: string }

    if (!result.success) {
      alert(`発注に失敗しました: ${result.error}`)
      setIsSubmitting(false)
      return
    }

    setOrderNumber(result.order_number || "")
    setIsSuccessDialogOpen(true)
    setOrderItems([])
    setIsSubmitting(false)
    setOrderHistory([])
  }

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">受付中</Badge>
      case "processing":
        return <Badge variant="default">処理中</Badge>
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-600">完了</Badge>
      case "cancelled":
        return <Badge variant="destructive">キャンセル</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-destructive">店舗が見つかりません</h1>
        <p className="text-muted-foreground">URLが正しいか確認してください</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">{store?.store_name}</h1>
            <p className="text-sm text-muted-foreground">発注システム</p>
          </div>
          {orderItems.length > 0 && activeTab === "order" && (
            <Badge variant="default" className="text-base px-3 py-1">
              <ShoppingCart className="size-4 mr-1" />
              {orderItems.length}点
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="order" className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              新規発注
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="size-4" />
              発注履歴
            </TabsTrigger>
          </TabsList>

          <TabsContent value="order">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>商品を選択</CardTitle>
                    <CardDescription>発注したい商品をクリックしてカートに追加</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
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
                          <SelectValue placeholder="カテゴリ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat!}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* エクステカテゴリ: 商品ライン選択UI */}
                    {isExtensionCategory && (
                      <div className="space-y-4">
                        {/* 商品ライン一覧 */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">商品ラインを選択</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {extensionLines.map((line) => (
                              <button
                                key={line.name}
                                onClick={() => {
                                  if (selectedLine === line.name) {
                                    setSelectedLine(null)
                                    setLineSelections({})
                                  } else {
                                    setSelectedLine(line.name)
                                    setLineSelections({})
                                  }
                                }}
                                className={`flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                                  selectedLine === line.name ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                                }`}
                              >
                                <div>
                                  <p className="font-medium">{line.name}</p>
                                  <p className="text-xs text-muted-foreground">{line.parsedProducts.length}種類</p>
                                </div>
                                {selectedLine === line.name ? (
                                  <ChevronDown className="size-4 text-primary" />
                                ) : (
                                  <ChevronRight className="size-4 text-muted-foreground" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 選択中のラインの階層セレクト */}
                        {selectedLine && currentLineData && (
                          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-primary">{selectedLine}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => { setSelectedLine(null); setLineSelections({}) }}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {currentLineData.availableOptions.map((opt) => (
                                <div key={opt.key} className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">{opt.key}</p>
                                  <Select
                                    value={lineSelections[opt.key] || ""}
                                    onValueChange={(value) => {
                                      const newSelections: Record<string, string> = {}
                                      // 選択したキーまでの値を保持、それ以降はリセット
                                      const attrOrder = currentLineData.line.attributeOrder
                                      for (const key of attrOrder) {
                                        if (key === opt.key) {
                                          newSelections[key] = value
                                          break
                                        }
                                        if (lineSelections[key]) {
                                          newSelections[key] = lineSelections[key]
                                        }
                                      }
                                      setLineSelections(newSelections)
                                    }}
                                  >
                                    <SelectTrigger className="w-36 bg-background">
                                      <SelectValue placeholder={`${opt.key}を選択`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {opt.values.map((val) => (
                                        <SelectItem key={val} value={val}>
                                          {val}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                            </div>

                            {/* 商品が確定したらカートに追加ボタン */}
                            {currentLineData.matchedProduct && (
                              <div className="flex items-center justify-between rounded-md border bg-background p-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{currentLineData.matchedProduct.product_name}</p>
                                  <p className="text-xs text-muted-foreground">{currentLineData.matchedProduct.product_code}</p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddExtProduct(currentLineData.matchedProduct!)}
                                >
                                  <Plus className="size-4" />
                                  カートに追加
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* エクステ単品商品（コーム、リムーバー等） */}
                        {filteredSingleExtProducts.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">その他のエクステ商品</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {filteredSingleExtProducts.map((product) => {
                                const inCart = orderItems.find(item => item.product_id === product.id)
                                return (
                                  <button
                                    key={product.id}
                                    onClick={() => handleAddProduct(product)}
                                    className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                                      inCart ? "border-primary bg-primary/5" : ""
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium truncate">{product.product_name}</p>
                                      <p className="text-xs text-muted-foreground">{product.product_code}</p>
                                    </div>
                                    {inCart ? (
                                      <Badge variant="default" className="ml-2 shrink-0">
                                        {inCart.quantity}
                                      </Badge>
                                    ) : (
                                      <Plus className="ml-2 size-4 shrink-0 text-muted-foreground" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 通常商品（エクステ以外） */}
                    {!isExtensionCategory && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {filteredProducts.length === 0 ? (
                          <p className="col-span-2 py-8 text-center text-muted-foreground">
                            商品が見つかりません
                          </p>
                        ) : (
                          filteredProducts.map((product) => {
                            const inCart = orderItems.find(item => item.product_id === product.id)
                            return (
                              <button
                                key={product.id}
                                onClick={() => handleAddProduct(product)}
                                className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                                  inCart ? "border-primary bg-primary/5" : ""
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{product.product_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.product_code} / {product.categories?.name || "-"}
                                  </p>
                                </div>
                                {inCart ? (
                                  <Badge variant="default" className="ml-2 shrink-0">
                                    {inCart.quantity}
                                  </Badge>
                                ) : (
                                  <Plus className="ml-2 size-4 shrink-0 text-muted-foreground" />
                                )}
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="size-5" />
                      発注内容
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderItems.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">
                        商品を選択してください
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {orderItems.map((item) => (
                            <div
                              key={item.product_id}
                              className="rounded-md border p-3 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium leading-tight">{item.product_name}</p>
                                  <p className="text-xs text-muted-foreground">{item.product_code}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 shrink-0 text-destructive"
                                  onClick={() => handleRemoveItem(item.product_id)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    if (!isNaN(val)) handleUpdateQuantity(item.product_id, val)
                                  }}
                                  className="w-14 text-center h-7"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                              <Textarea
                                placeholder="備考（任意）"
                                value={item.notes}
                                onChange={(e) => handleUpdateNotes(item.product_id, e.target.value)}
                                className="text-xs min-h-[2rem] h-8 resize-none"
                                rows={1}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between text-sm mb-4">
                            <span className="text-muted-foreground">合計点数</span>
                            <span className="font-bold">
                              {orderItems.reduce((sum, item) => sum + item.quantity, 0)}点
                            </span>
                          </div>
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="size-4" />
                            )}
                            発注を送信
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-5" />
                  発注履歴
                </CardTitle>
                <CardDescription>この店舗の発注履歴（直近50件）</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orderHistory.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-muted-foreground gap-2">
                    <History className="size-8" />
                    <p className="text-sm">発注履歴がありません</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="border rounded-lg">
                        <button
                          onClick={() => toggleOrderExpanded(order.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {expandedOrders.has(order.id) ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                            <div className="text-left">
                              <p className="font-mono font-medium">{order.order_number}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {order.items.length}商品
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                        </button>
                        {expandedOrders.has(order.id) && (
                          <div className="border-t px-4 pb-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>商品コード</TableHead>
                                  <TableHead>商品名</TableHead>
                                  <TableHead className="text-right">数量</TableHead>
                                  <TableHead>備考</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-mono text-sm">{item.product_code}</TableCell>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {item.notes || "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="size-5" />
              発注を受け付けました
            </DialogTitle>
            <DialogDescription>
              本部にて処理されるまでお待ちください
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">発注番号</p>
            <p className="text-2xl font-bold font-mono">{orderNumber}</p>
          </div>
          <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full">
            新しい発注を作成
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isMinimumOrderDialogOpen} onOpenChange={setIsMinimumOrderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>最低発注金額に達していないメーカーがあります</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>以下のメーカーは最低発注金額を下回っているため、このままでは発注できません。</p>
                <div className="space-y-2 rounded-md border bg-muted/50 p-3">
                  {minimumOrderViolations.map((violation) => (
                    <div key={violation.makerId} className="rounded-md bg-background p-3">
                      <p className="font-medium text-foreground">{violation.makerName}</p>
                      <p>現在の発注金額: {formatCurrency(violation.currentTotal)}</p>
                      <p>最低発注金額: {formatCurrency(violation.minimumOrder)}</p>
                      <p className="text-destructive">不足額: {formatCurrency(violation.shortage)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsMinimumOrderDialogOpen(false)}>
              内容を確認する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
