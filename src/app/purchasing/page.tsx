"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Search, Loader2, ChevronDown, ChevronRight, Package, ShoppingBag, CheckCircle2, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type OrderItemWithDetails = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  product_code: string
  product_name: string
  maker_name: string
  maker_id: string
  category_name: string
  store_name: string
  store_code: string
  order_number: string
}

type HqInventory = {
  product_id: string
  quantity: number
}

type ProductSummary = {
  product_id: string
  product_code: string
  product_name: string
  maker_name: string
  maker_id: string
  category_name: string
  total_quantity: number
  stores: {
    store_name: string
    store_code: string
    order_number: string
    quantity: number
  }[]
  isPurchased: boolean
  assignedStaff: "浅野" | "金本"
  hqStock: number
}

type MakerGroup = {
  maker_id: string
  maker_name: string
  products: ProductSummary[]
  isOpen: boolean
}

export default function PurchasingPage() {
  const [orderItems, setOrderItems] = useState<OrderItemWithDetails[]>([])
  const [hqInventory, setHqInventory] = useState<HqInventory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMaker, setSelectedMaker] = useState<string>("all")
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set())
  const [openMakers, setOpenMakers] = useState<Set<string>>(new Set())

  const supabase = createClient()

  const fetchOrderItems = async () => {
    setIsLoading(true)

    // Fetch pending orders with all details
    const [ordersResult, inventoryResult] = await Promise.all([
      supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          orders!inner (
            id,
            order_number,
            status,
            stores (
              id,
              store_name,
              store_code
            )
          ),
          products (
            id,
            product_code,
            product_name,
            makers (
              id,
              name
            ),
            categories (
              id,
              name
            )
          )
        `)
        .eq("orders.status", "pending"),
      supabase
        .from("hq_inventory")
        .select("product_id, quantity")
    ])

    if (ordersResult.error) {
      console.error("Error fetching order items:", ordersResult.error)
      setIsLoading(false)
      return
    }

    // Set HQ inventory
    if (inventoryResult.data) {
      setHqInventory(inventoryResult.data)
    }

    // Transform data
    const items: OrderItemWithDetails[] = (ordersResult.data || []).map((item) => {
      const order = item.orders as unknown as {
        id: string
        order_number: string
        status: string
        stores: { id: string; store_name: string; store_code: string }
      }
      const product = item.products as unknown as {
        id: string
        product_code: string
        product_name: string
        makers: { id: string; name: string } | null
        categories: { id: string; name: string } | null
      }

      return {
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product_code: product?.product_code || "",
        product_name: product?.product_name || "",
        maker_name: product?.makers?.name || "未設定",
        maker_id: product?.makers?.id || "unknown",
        category_name: product?.categories?.name || "-",
        store_name: order?.stores?.store_name || "",
        store_code: order?.stores?.store_code || "",
        order_number: order?.order_number || "",
      }
    })

    setOrderItems(items)

    // Open all makers by default
    const makerIds = new Set(items.map(item => item.maker_id))
    setOpenMakers(makerIds)

    setIsLoading(false)
  }

  // Get HQ stock for a product
  const getHqStock = (productId: string): number => {
    const inv = hqInventory.find(i => i.product_id === productId)
    return inv?.quantity || 0
  }

  // Determine assigned staff based on HQ stock
  const getAssignedStaff = (productId: string): "浅野" | "金本" => {
    const stock = getHqStock(productId)
    return stock > 0 ? "浅野" : "金本"
  }

  useEffect(() => {
    fetchOrderItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Group by product and aggregate
  const productSummaries: ProductSummary[] = orderItems.reduce((acc, item) => {
    const existing = acc.find(p => p.product_id === item.product_id)

    if (existing) {
      existing.total_quantity += item.quantity
      const existingStore = existing.stores.find(s => s.store_code === item.store_code)
      if (existingStore) {
        existingStore.quantity += item.quantity
      } else {
        existing.stores.push({
          store_name: item.store_name,
          store_code: item.store_code,
          order_number: item.order_number,
          quantity: item.quantity,
        })
      }
    } else {
      const hqStock = getHqStock(item.product_id)
      acc.push({
        product_id: item.product_id,
        product_code: item.product_code,
        product_name: item.product_name,
        maker_name: item.maker_name,
        maker_id: item.maker_id,
        category_name: item.category_name,
        total_quantity: item.quantity,
        stores: [{
          store_name: item.store_name,
          store_code: item.store_code,
          order_number: item.order_number,
          quantity: item.quantity,
        }],
        isPurchased: purchasedItems.has(item.product_id),
        assignedStaff: getAssignedStaff(item.product_id),
        hqStock: hqStock,
      })
    }

    return acc
  }, [] as ProductSummary[])

  // Apply purchased status and update staff assignment
  productSummaries.forEach(p => {
    p.isPurchased = purchasedItems.has(p.product_id)
    p.hqStock = getHqStock(p.product_id)
    p.assignedStaff = getAssignedStaff(p.product_id)
  })

  // Filter by search, maker, and staff
  const filteredProducts = productSummaries.filter(product => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.maker_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMaker = selectedMaker === "all" || product.maker_id === selectedMaker
    const matchesStaff = selectedStaff === "all" || product.assignedStaff === selectedStaff
    return matchesSearch && matchesMaker && matchesStaff
  })

  // Group by maker
  const makerGroups: MakerGroup[] = filteredProducts.reduce((acc, product) => {
    const existing = acc.find(g => g.maker_id === product.maker_id)
    if (existing) {
      existing.products.push(product)
    } else {
      acc.push({
        maker_id: product.maker_id,
        maker_name: product.maker_name,
        products: [product],
        isOpen: openMakers.has(product.maker_id),
      })
    }
    return acc
  }, [] as MakerGroup[])

  // Sort by maker name
  makerGroups.sort((a, b) => a.maker_name.localeCompare(b.maker_name, "ja"))

  // Get unique makers for filter
  const makers = [...new Set(productSummaries.map(p => ({ id: p.maker_id, name: p.maker_name })))]
    .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
    .sort((a, b) => a.name.localeCompare(b.name, "ja"))

  const toggleMaker = (makerId: string) => {
    const newOpen = new Set(openMakers)
    if (newOpen.has(makerId)) {
      newOpen.delete(makerId)
    } else {
      newOpen.add(makerId)
    }
    setOpenMakers(newOpen)
  }

  const togglePurchased = (productId: string) => {
    const newPurchased = new Set(purchasedItems)
    if (newPurchased.has(productId)) {
      newPurchased.delete(productId)
    } else {
      newPurchased.add(productId)
    }
    setPurchasedItems(newPurchased)
  }

  const totalProducts = filteredProducts.length
  const purchasedCount = filteredProducts.filter(p => purchasedItems.has(p.product_id)).length
  const totalQuantity = filteredProducts.reduce((sum, p) => sum + p.total_quantity, 0)
  const asanoCount = filteredProducts.filter(p => p.assignedStaff === "浅野").length
  const kanemotoCount = filteredProducts.filter(p => p.assignedStaff === "金本").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">購入リスト</h1>
          <p className="text-muted-foreground text-pretty">
            各店舗からの発注をメーカー別・商品別にまとめて表示
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Badge variant="default" className="px-2 py-1">
              浅野 {asanoCount}
            </Badge>
            <Badge variant="secondary" className="px-2 py-1">
              金本 {kanemotoCount}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">進捗</p>
            <p className="text-lg font-bold">{purchasedCount} / {totalProducts}</p>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            <Package className="size-4 mr-1" />
            {totalQuantity} 点
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="商品名・商品コード・メーカー名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-full sm:w-36">
                <User className="size-4 mr-2" />
                <SelectValue placeholder="担当者" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全員</SelectItem>
                <SelectItem value="浅野">浅野さん</SelectItem>
                <SelectItem value="金本">金本さん</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedMaker} onValueChange={setSelectedMaker}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="メーカー" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのメーカー</SelectItem>
                {makers.map((maker) => (
                  <SelectItem key={maker.id} value={maker.id}>
                    {maker.name}
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
          ) : makerGroups.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground gap-2">
              <ShoppingBag className="size-8" />
              <p className="text-sm">
                {orderItems.length === 0
                  ? "発注待ちの商品がありません"
                  : "検索条件に一致する商品がありません"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {makerGroups.map((group) => (
                <Collapsible
                  key={group.maker_id}
                  open={openMakers.has(group.maker_id)}
                  onOpenChange={() => toggleMaker(group.maker_id)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {openMakers.has(group.maker_id) ? (
                              <ChevronDown className="size-5" />
                            ) : (
                              <ChevronRight className="size-5" />
                            )}
                            {group.maker_name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {group.products.length} 商品
                            </Badge>
                            <Badge variant="outline">
                              {group.products.reduce((sum, p) => sum + p.total_quantity, 0)} 点
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">済</TableHead>
                              <TableHead className="w-20">担当</TableHead>
                              <TableHead>商品コード</TableHead>
                              <TableHead>商品名</TableHead>
                              <TableHead>カテゴリ</TableHead>
                              <TableHead className="text-right">合計数量</TableHead>
                              <TableHead className="text-right">本部在庫</TableHead>
                              <TableHead>店舗内訳</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.products.map((product) => (
                              <TableRow
                                key={product.product_id}
                                className={purchasedItems.has(product.product_id) ? "opacity-50 bg-muted/30" : ""}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={purchasedItems.has(product.product_id)}
                                    onCheckedChange={() => togglePurchased(product.product_id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={product.assignedStaff === "浅野" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {product.assignedStaff}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {product.product_code}
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {purchasedItems.has(product.product_id) && (
                                      <CheckCircle2 className="size-4 text-green-600" />
                                    )}
                                    <span className={purchasedItems.has(product.product_id) ? "line-through" : ""}>
                                      {product.product_name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{product.category_name}</TableCell>
                                <TableCell className="text-right font-bold text-lg">
                                  {product.total_quantity}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {product.hqStock > 0 ? (
                                    <span className="text-green-600 font-medium">{product.hqStock}</span>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {product.stores.map((store) => (
                                      <Badge
                                        key={store.store_code}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {store.store_name}: {store.quantity}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
