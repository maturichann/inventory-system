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
import { Plus, Trash2, ShoppingCart, Loader2, Check, Search, History, ChevronDown, ChevronRight, X, Pencil, Layers3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Store, Product, Category, Maker } from "@/types/database"

type ProductWithCategory = Product & {
  categories: Category | null
  makers: Pick<Maker, "id" | "maker_name" | "minimum_order"> | null
}

type CartItem = {
  order_item_id?: string
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
    id: string
    product_id: string
    product_name: string
    product_code: string
    category_name: string
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
  "NUMEROフラットラッシュカラー": ["カール", "長さ", "カラー"],
  "ボリュームラッシュリュクス": ["カール", "長さ"],
  "ベルシアエクステ（フラットラッシュ）": ["カール", "太さ", "長さ"],
  "ベルシアエクステ（フラットブラウン）": ["カール", "長さ"],
}

// 商品名からエクステ属性を解析
function parseExtensionProduct(product: ProductWithCategory): ParsedExtProduct | null {
  const name = product.product_name

  // NUMEROフラットラッシュカラー: "NUMEROフラットラッシュマットカラー長さMIX SCカール カラー名"
  const numeroMatch = name.match(/^NUMEROフラットラッシュ.*長さ(\S+)\s+(\S+)カール\s+(.+)$/)
  if (numeroMatch) {
    return {
      product,
      line: "NUMEROフラットラッシュカラー",
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

const DOCUMENT_CATEGORY_KEYWORDS = ["書類", "メールDM", "のし紙"]

const COLOR_SWATCHES: Array<{ keywords: string[]; color: string }> = [
  { keywords: ["ブラック", "黒"], color: "#1f2937" },
  { keywords: ["ブラウン", "茶", "モカ"], color: "#8b5e3c" },
  { keywords: ["モーヴ", "パープル", "紫"], color: "#8b5cf6" },
  { keywords: ["ピンク", "ローズ"], color: "#ec4899" },
  { keywords: ["レッド", "赤", "ワイン"], color: "#dc2626" },
  { keywords: ["オレンジ", "コーラル"], color: "#f97316" },
  { keywords: ["イエロー", "黄", "ゴールド"], color: "#eab308" },
  { keywords: ["グリーン", "緑", "オリーブ"], color: "#65a30d" },
  { keywords: ["ブルー", "青", "ネイビー"], color: "#2563eb" },
  { keywords: ["グレー", "灰", "シルバー"], color: "#9ca3af" },
  { keywords: ["ベージュ", "アイボリー", "クリーム"], color: "#d6c3a1" },
  { keywords: ["ホワイト", "白"], color: "#f8fafc" },
]

function isDocumentCategory(categoryName: string | null | undefined) {
  if (!categoryName) return false
  return DOCUMENT_CATEGORY_KEYWORDS.some((keyword) => categoryName.includes(keyword))
}

// 書類系は実数量は1単位刻み（強制なし）。入力欄幅を広げる用途は isDocumentCategory で別途判定。
function getQuantityStep(_categoryName: string | null | undefined) {
  return 1
}

function getColorSwatch(colorName: string) {
  const matched = COLOR_SWATCHES.find(({ keywords }) =>
    keywords.some((keyword) => colorName.includes(keyword))
  )

  return matched?.color ?? "#cbd5e1"
}

function getProductDisplay(product: ProductWithCategory) {
  const parsed = parseExtensionProduct(product)
  if (!parsed) {
    return {
      title: product.product_name,
      subtitle: product.product_code,
      emphasis: null as string | null,
      parsed: null as ParsedExtProduct | null,
    }
  }

  const emphasis =
    parsed.attributes["カラー"] ||
    parsed.attributes["長さ"] ||
    parsed.attributes["太さ"] ||
    parsed.attributes["カール"] ||
    null

  return {
    title: parsed.line,
    subtitle: product.product_code,
    emphasis,
    parsed,
  }
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
  const [lastSubmitMode, setLastSubmitMode] = useState<"create" | "update">("create")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [notFound, setNotFound] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("order")
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editingOrderNumber, setEditingOrderNumber] = useState("")

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
          id,
          product_id,
          products (
            product_name,
            product_code,
            categories (
              name
            )
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
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.product_name || "",
        product_code: item.products?.product_code || "",
        category_name: item.products?.categories?.name || "-",
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

  const selectedCategoryObj = useMemo(() => {
    if (selectedCategory === "all") return null
    return products.find(p => p.categories?.name === selectedCategory)?.categories || null
  }, [selectedCategory, products])

  const visibleProductsByCategory = useMemo(() => {
    if (selectedCategory === "all") return products
    return products.filter((product) => product.categories?.name === selectedCategory)
  }, [products, selectedCategory])

  // 階層パース可能なエクステ商品のみ階層UIへ。エクステその他（リムーバー等）は通常商品扱い。
  const extensionCandidateProducts = useMemo(
    () =>
      visibleProductsByCategory.filter(
        (product) => product.categories?.is_extension === true && parseExtensionProduct(product) !== null
      ),
    [visibleProductsByCategory]
  )

  const regularCandidateProducts = useMemo(
    () =>
      visibleProductsByCategory.filter(
        (product) => product.categories?.is_extension !== true || parseExtensionProduct(product) === null
      ),
    [visibleProductsByCategory]
  )

  const isExtensionCategory = extensionCandidateProducts.length > 0 && (
    selectedCategory === "all" || selectedCategoryObj?.is_extension === true
  )

  const extensionSearchFilteredProducts = useMemo(() => {
    if (!isExtensionCategory) return []
    return extensionCandidateProducts.filter((product) =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [extensionCandidateProducts, isExtensionCategory, searchQuery])

  // エクステ商品を商品ラインと単品に分類
  const { extensionLines, singleExtProducts } = useMemo(() => {
    if (!isExtensionCategory) return { extensionLines: [], singleExtProducts: [] }

    const extProducts = extensionSearchFilteredProducts
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
  }, [extensionSearchFilteredProducts, isExtensionCategory])

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
    return regularCandidateProducts.filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [regularCandidateProducts, searchQuery])

  // エクステ単品のフィルタリング（検索対応）
  const filteredSingleExtProducts = useMemo(() => {
    if (!isExtensionCategory) return []
    return singleExtProducts
  }, [isExtensionCategory, singleExtProducts])

  const handleAddProduct = (product: ProductWithCategory) => {
    const step = getQuantityStep(product.categories?.name)

    if (orderItems.some(item => item.product_id === product.id)) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + step }
          : item
      ))
      return
    }

    setOrderItems([...orderItems, {
      product_id: product.id,
      product_code: product.product_code,
      product_name: product.product_name,
      category_name: product.categories?.name || "-",
      quantity: step,
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

  const resetEditingOrder = () => {
    setEditingOrderId(null)
    setEditingOrderNumber("")
  }

  const handleEditOrder = (order: OrderHistory) => {
    setEditingOrderId(order.id)
    setEditingOrderNumber(order.order_number)
    setOrderItems(order.items.map((item) => ({
      order_item_id: item.id,
      product_id: item.product_id,
      product_code: item.product_code,
      product_name: item.product_name,
      category_name: item.category_name,
      quantity: item.quantity,
      notes: item.notes || "",
    })))
    setActiveTab("order")
  }

  const getOrderItemFulfillment = async (items: CartItem[]) => {
    const productIds = [...new Set(items.map((item) => item.product_id))]
    const [{ data: productRows, error: productError }, { data: inventoryRows, error: inventoryError }] = await Promise.all([
      supabase
        .from("products")
        .select("id, track_hq_inventory")
        .in("id", productIds),
      supabase
        .from("hq_inventory")
        .select("product_id, quantity")
        .in("product_id", productIds),
    ])

    if (productError || inventoryError) {
      throw productError || inventoryError
    }

    const productMap = new Map((productRows || []).map((product) => [product.id, product]))
    const inventoryMap = new Map((inventoryRows || []).map((inventory) => [inventory.product_id, inventory.quantity]))

    return items.map((item) => {
      const product = productMap.get(item.product_id)
      const hqStock = inventoryMap.get(item.product_id) ?? 0
      const trackHqInventory = product?.track_hq_inventory ?? true
      const fulfilledFrom = !trackHqInventory
        ? "supplier"
        : hqStock >= item.quantity
          ? "hq"
          : "supplier"

      return {
        ...item,
        hqStockAtOrder: hqStock,
        fulfilledFrom,
      }
    })
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

    // 単価未設定（0円）の商品があると最低発注金額判定が機能しないため、警告して止める
    const zeroPriceItems = orderItems.filter((item) => {
      const product = productMap.get(item.product_id)
      const maker = product?.makers
      return product && maker && maker.minimum_order > 0 && (product.unit_price ?? 0) <= 0
    })
    if (zeroPriceItems.length > 0) {
      const names = zeroPriceItems.map((it) => `・${it.product_name}`).join("\n")
      alert(`次の商品は単価が未設定（0円）のため、最低発注金額の判定ができません。商品マスターで単価を入力してから発注してください。\n\n${names}`)
      return
    }

    const makerTotals = new Map<string, MinimumOrderViolation>()

    for (const item of orderItems) {
      const product = productMap.get(item.product_id)
      const maker = product?.makers

      if (!product || !maker || maker.minimum_order <= 0) {
        continue
      }

      const current = makerTotals.get(maker.id)
      // 最低発注金額の判定は単価（unit_price）ベース。cost_priceは未入力の商品が多いため使用しない。
      const lineTotal = (product.unit_price ?? 0) * item.quantity

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

    if (editingOrderId) {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, order_number, status")
        .eq("id", editingOrderId)
        .single()

      if (orderError || !orderData) {
        console.error("Error fetching order for update:", orderError)
        alert("更新対象の発注が見つかりません")
        setIsSubmitting(false)
        return
      }

      if (orderData.status !== "pending") {
        alert("未処理の発注のみ修正できます")
        resetEditingOrder()
        setIsSubmitting(false)
        return
      }

      const { data: existingOrderItems, error: existingItemsError } = await supabase
        .from("order_items")
        .select("id, product_id")
        .eq("order_id", editingOrderId)

      if (existingItemsError) {
        console.error("Error fetching existing order items:", existingItemsError)
        alert("発注明細の取得に失敗しました")
        setIsSubmitting(false)
        return
      }

      try {
        const itemsWithFulfillment = await getOrderItemFulfillment(orderItems)
        const existingByProductId = new Map((existingOrderItems || []).map((item) => [item.product_id, item.id]))
        const incomingProductIds = new Set(orderItems.map((item) => item.product_id))
        const orderItemIdsToDelete = (existingOrderItems || [])
          .filter((item) => !incomingProductIds.has(item.product_id))
          .map((item) => item.id)

        if (orderItemIdsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("order_items")
            .delete()
            .in("id", orderItemIdsToDelete)

          if (deleteError) throw deleteError
        }

        for (const item of itemsWithFulfillment) {
          const payload = {
            quantity: item.quantity,
            notes: item.notes || null,
            hq_stock_at_order: item.hqStockAtOrder,
            fulfilled_from: item.fulfilledFrom,
          }

          const existingId = existingByProductId.get(item.product_id)
          if (existingId) {
            const { error: updateError } = await supabase
              .from("order_items")
              .update(payload)
              .eq("id", existingId)

            if (updateError) throw updateError
          } else {
            const { error: insertError } = await supabase
              .from("order_items")
              .insert({
                order_id: editingOrderId,
                product_id: item.product_id,
                quantity: item.quantity,
                notes: item.notes || null,
                hq_stock_at_order: item.hqStockAtOrder,
                fulfilled_from: item.fulfilledFrom,
              })

            if (insertError) throw insertError
          }
        }

        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", editingOrderId)

        if (orderUpdateError) throw orderUpdateError

        setOrderNumber(orderData.order_number || editingOrderNumber)
        setLastSubmitMode("update")
        setIsSuccessDialogOpen(true)
        setOrderItems([])
        setOrderHistory([])
      } catch (error) {
        console.error("Error updating order:", error)
        alert("発注の更新に失敗しました")
        setIsSubmitting(false)
        return
      }
    } else {
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
      setLastSubmitMode("create")
      setIsSuccessDialogOpen(true)
      setOrderItems([])
      setOrderHistory([])
    }

    setIsSubmitting(false)
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
                {editingOrderId && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-primary">発注修正モード</p>
                        <p className="text-sm text-muted-foreground">
                          発注番号 <span className="font-mono font-medium text-foreground">{editingOrderNumber}</span> を編集中です。
                        </p>
                      </div>
                      <Button variant="outline" onClick={resetEditingOrder}>
                        新規発注に戻す
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>商品を選択</CardTitle>
                    <CardDescription>ラインと属性を選びながら、見分けやすい表示で商品を追加できます</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
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
                      <div className="space-y-5">
                        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                              <Layers3 className="size-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-base font-semibold">エクステ商品は階層で選択</p>
                              <p className="text-sm text-muted-foreground">
                                商品ラインを選んでから、カール・長さ・カラーの順に絞り込むと見間違いを減らせます。
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 商品ライン一覧 */}
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">商品ラインを選択</p>
                          <div className="grid gap-3 sm:grid-cols-2">
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
                                className={`flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors hover:bg-accent ${
                                  selectedLine === line.name ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "bg-card"
                                }`}
                              >
                                <div>
                                  <p className="text-base font-semibold">{line.name}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{line.parsedProducts.length}種類</p>
                                </div>
                                {selectedLine === line.name ? (
                                  <ChevronDown className="size-5 text-primary" />
                                ) : (
                                  <ChevronRight className="size-5 text-muted-foreground" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 選択中のラインの階層セレクト */}
                        {selectedLine && currentLineData && (
                          <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-lg font-semibold text-primary">{selectedLine}</p>
                                <p className="text-sm text-muted-foreground">属性を上から順に選択してください</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => { setSelectedLine(null); setLineSelections({}) }}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>

                            <div className="flex flex-wrap gap-4">
                              {currentLineData.availableOptions.map((opt) => (
                                <div key={opt.key} className="space-y-2">
                                  <p className="text-sm font-medium text-muted-foreground">{opt.key}</p>
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
                                    <SelectTrigger className="h-11 w-44 bg-background text-base">
                                      <SelectValue placeholder={`${opt.key}を選択`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {opt.values.map((val) => (
                                        <SelectItem key={val} value={val}>
                                          <div className="flex items-center gap-2">
                                            {opt.key === "カラー" && (
                                              <span
                                                className="size-3 rounded-full border border-slate-300"
                                                style={{ backgroundColor: getColorSwatch(val) }}
                                              />
                                            )}
                                            <span>{val}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                            </div>

                            {/* 商品が確定したらカートに追加ボタン */}
                            {currentLineData.matchedProduct && (
                              <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 flex-1 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-base font-semibold">{selectedLine}</p>
                                    {(() => {
                                      const display = getProductDisplay(currentLineData.matchedProduct)
                                      return display.emphasis ? (
                                        <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1 text-sm">
                                          {display.parsed?.attributes["カラー"] && (
                                            <span
                                              className="size-3 rounded-full border border-slate-300"
                                              style={{ backgroundColor: getColorSwatch(display.parsed.attributes["カラー"]) }}
                                            />
                                          )}
                                          <span className="font-semibold">{display.emphasis}</span>
                                        </Badge>
                                      ) : null
                                    })()}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {currentLineData.line.attributeOrder.map((key) => (
                                      lineSelections[key] ? (
                                        <Badge key={key} variant="outline" className="px-3 py-1 text-sm">
                                          {key}: {lineSelections[key]}
                                        </Badge>
                                      ) : null
                                    ))}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{currentLineData.matchedProduct.product_code}</p>
                                </div>
                                <Button
                                  size="lg"
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
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">その他のエクステ商品</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {filteredSingleExtProducts.map((product) => {
                                const inCart = orderItems.find(item => item.product_id === product.id)
                                const display = getProductDisplay(product)
                                return (
                                  <button
                                    key={product.id}
                                    onClick={() => handleAddProduct(product)}
                                    className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors hover:bg-accent ${
                                      inCart ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-base font-semibold">{display.title}</p>
                                        {display.emphasis && (
                                          <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1 text-sm">
                                            {display.parsed?.attributes["カラー"] && (
                                              <span
                                                className="size-3 rounded-full border border-slate-300"
                                                style={{ backgroundColor: getColorSwatch(display.parsed.attributes["カラー"]) }}
                                              />
                                            )}
                                            <span className="font-semibold">{display.emphasis}</span>
                                          </Badge>
                                        )}
                                      </div>
                                      {display.parsed && (
                                        <div className="flex flex-wrap gap-2">
                                          {Object.entries(display.parsed.attributes).map(([key, value]) => (
                                            <Badge key={key} variant="outline" className="px-2.5 py-0.5">
                                              {key}: {value}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                      <p className="text-sm text-muted-foreground">{product.product_code}</p>
                                    </div>
                                    {inCart ? (
                                      <Badge variant="default" className="ml-2 shrink-0 text-sm">
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
                    {filteredProducts.length > 0 && (
                      <div className="space-y-3">
                        {isExtensionCategory && (
                          <p className="text-sm font-medium text-muted-foreground">通常商品</p>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {filteredProducts.map((product) => {
                            const inCart = orderItems.find(item => item.product_id === product.id)
                            const display = getProductDisplay(product)
                            return (
                              <button
                                key={product.id}
                                onClick={() => handleAddProduct(product)}
                                className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors hover:bg-accent ${
                                  inCart ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
                                }`}
                              >
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-base font-semibold">{display.title}</p>
                                    {display.emphasis && (
                                      <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1 text-sm">
                                        {display.parsed?.attributes["カラー"] && (
                                          <span
                                            className="size-3 rounded-full border border-slate-300"
                                            style={{ backgroundColor: getColorSwatch(display.parsed.attributes["カラー"]) }}
                                          />
                                        )}
                                        <span className="font-semibold">{display.emphasis}</span>
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {product.product_code} / {product.categories?.name || "-"}
                                  </p>
                                </div>
                                {inCart ? (
                                  <Badge variant="default" className="ml-2 shrink-0 text-sm">
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

                    {((isExtensionCategory && extensionLines.length === 0 && filteredSingleExtProducts.length === 0 && filteredProducts.length === 0)
                      || (!isExtensionCategory && filteredProducts.length === 0)) && (
                      <p className="py-8 text-center text-muted-foreground">
                        商品が見つかりません
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="sticky top-4 flex max-h-[calc(100dvh-2rem)] flex-col">
                  <CardHeader className="shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="size-5" />
                      発注内容
                      {orderItems.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {orderItems.length}点
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col">
                    {orderItems.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">
                        商品を選択してください
                      </p>
                    ) : (
                      <div className="flex min-h-0 flex-1 flex-col gap-4">
                        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2">
                         <div className="space-y-3">
                          {orderItems.map((item) => (
                            <div
                              key={item.product_id}
                              className="space-y-3 rounded-xl border p-4"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="text-base font-semibold leading-tight">{item.product_name}</p>
                                  <p className="text-sm text-muted-foreground">{item.product_code}</p>
                                  {isDocumentCategory(item.category_name) && (
                                    <Badge variant="outline" className="text-xs">
                                      100単位の目安あり
                                    </Badge>
                                  )}
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
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => handleUpdateQuantity(item.product_id, item.quantity - getQuantityStep(item.category_name))}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min={getQuantityStep(item.category_name)}
                                  step={getQuantityStep(item.category_name)}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    if (!isNaN(val)) handleUpdateQuantity(item.product_id, val)
                                  }}
                                  className={`h-9 text-center text-base ${isDocumentCategory(item.category_name) ? "w-24" : "w-16"}`}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => handleUpdateQuantity(item.product_id, item.quantity + getQuantityStep(item.category_name))}
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
                            {editingOrderId ? "発注内容を更新" : "発注を送信"}
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
                        <div className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => toggleOrderExpanded(order.id)}
                              className="flex items-center gap-4 text-left"
                            >
                              {expandedOrders.has(order.id) ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                              <div className="text-left">
                                <p className="font-mono font-medium">{order.order_number}</p>
                                <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                              </div>
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {order.items.length}商品
                            </span>
                            {order.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditOrder(order)}
                              >
                                <Pencil className="size-4" />
                                修正
                              </Button>
                            )}
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
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
              {lastSubmitMode === "update" ? "発注内容を更新しました" : "発注を受け付けました"}
            </DialogTitle>
            <DialogDescription>
              {lastSubmitMode === "update" ? "更新内容を保存しました" : "本部にて処理されるまでお待ちください"}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">発注番号</p>
            <p className="text-2xl font-bold font-mono">{orderNumber}</p>
          </div>
          <Button onClick={() => {
            setIsSuccessDialogOpen(false)
            resetEditingOrder()
          }} className="w-full">
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
