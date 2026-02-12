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
  default_staff_name: string | null
}

type HqInventory = {
  product_id: string
  quantity: number
}

type StoreInfo = {
  store_name: string
  store_code: string
  order_number: string
  quantity: number
  checkKey: string // product_id_store_code
}

type ProductSummary = {
  product_id: string
  product_code: string
  product_name: string
  maker_name: string
  maker_id: string
  category_name: string
  total_quantity: number
  stores: StoreInfo[]
  assignedStaff: string
  defaultStaffName: string | null
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
  // 店舗ごとのチェック状態（キー: product_id_store_code）
  const [checkedStores, setCheckedStores] = useState<Set<string>>(new Set())
  const [openMakers, setOpenMakers] = useState<Set<string>>(new Set())

  const supabase = createClient()

  const fetchOrderItems = async () => {
    setIsLoading(true)

    const [ordersResult, inventoryResult] = await Promise.all([
      supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          fulfilled_from,
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
            assigned_staff_id,
            makers (
              id,
              maker_name
            ),
            categories (
              id,
              name
            ),
            staff (
              id,
              name
            )
          )
        `),
      supabase
        .from("hq_inventory")
        .select("product_id, quantity")
    ])

    if (ordersResult.error) {
      console.error("Error fetching order items:", ordersResult.error)
      setIsLoading(false)
      return
    }

    if (inventoryResult.data) {
      setHqInventory(inventoryResult.data)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: OrderItemWithDetails[] = (ordersResult.data || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => {
        const status = item.orders?.status
        const isActiveOrder = status === "pending" || status === "processing"
        const isSupplierItem = item.fulfilled_from === "supplier" || item.fulfilled_from === null
        return isActiveOrder && isSupplierItem
      })
      .map((item) => {
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
        assigned_staff_id: string | null
        makers: { id: string; maker_name: string } | null
        categories: { id: string; name: string } | null
        staff: { id: string; name: string } | null
      }

      return {
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product_code: product?.product_code || "",
        product_name: product?.product_name || "",
        maker_name: product?.makers?.maker_name || "未設定",
        maker_id: product?.makers?.id || "unknown",
        category_name: product?.categories?.name || "-",
        store_name: order?.stores?.store_name || "",
        store_code: order?.stores?.store_code || "",
        order_number: order?.order_number || "",
        default_staff_name: product?.staff?.name || null,
      }
    })

    setOrderItems(items)

    const makerIds = new Set(items.map(item => item.maker_id))
    setOpenMakers(makerIds)

    setIsLoading(false)
  }

  const getHqStock = (productId: string): number => {
    const inv = hqInventory.find(i => i.product_id === productId)
    return inv?.quantity || 0
  }

  const getAssignedStaff = (productId: string, defaultStaffName: string | null): string => {
    const stock = getHqStock(productId)
    if (stock > 0) {
      return "浅野"
    }
    return defaultStaffName || "未設定"
  }

  useEffect(() => {
    fetchOrderItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Group by product and aggregate
  const productSummaries: ProductSummary[] = orderItems.reduce((acc, item) => {
    const existing = acc.find(p => p.product_id === item.product_id)
    const checkKey = `\${item.product_id}_\${item.store_code}`

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
          checkKey: checkKey,
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
          checkKey: checkKey,
        }],
        assignedStaff: getAssignedStaff(item.product_id, item.default_staff_name),
        defaultStaffName: item.default_staff_name,
        hqStock: hqStock,
      })
    }

    return acc
  }, [] as ProductSummary[])

  // Update hqStock and assignedStaff
  productSummaries.forEach(p => {
    p.hqStock = getHqStock(p.product_id)
    p.assignedStaff = getAssignedStaff(p.product_id, p.defaultStaffName)
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

  makerGroups.sort((a, b) => a.maker_name.localeCompare(b.maker_name, "ja"))

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

  // 店舗ごとのチェック切り替え
  const toggleStoreCheck = (checkKey: string) => {
    const newChecked = new Set(checkedStores)
    if (newChecked.has(checkKey)) {
      newChecked.delete(checkKey)
    } else {
      newChecked.add(checkKey)
    }
    setCheckedStores(newChecked)
  }

  // 商品の全店舗がチェック済みかどうか
  const isProductAllChecked = (product: ProductSummary): boolean => {
    return product.stores.every(s => checkedStores.has(s.checkKey))
  }

  // Get unique staff names for filter
  const uniqueStaffNames = [...new Set(productSummaries.map(p => p.assignedStaff))].sort()

  // 全店舗数と完了店舗数をカウント
  const totalStoreOrders = filteredProducts.reduce((sum, p) => sum + p.stores.length, 0)
  const checkedStoreOrders = filteredProducts.reduce((sum, p) => 
    sum + p.stores.filter(s => checkedStores.has(s.checkKey)).length, 0
  )
  const totalQuantity = filteredProducts.reduce((sum, p) => sum + p.total_quantity, 0)

  // Count by staff
  const staffCounts = uniqueStaffNames.reduce((acc, name) => {
    acc[name] = filteredProducts.filter(p => p.assignedStaff === name).length
    return acc
  }, {} as Record<string, number>)

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
          <div className="flex gap-2 flex-wrap">
            {uniqueStaffNames.map((name) => (
              <Badge
                key={name}
                variant={name === "浅野" ? "default" : name === "金本" ? "secondary" : "outline"}
                className="px-2 py-1"
              >
                {name} {staffCounts[name] || 0}
              </Badge>
            ))}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">進捗（店舗単位）</p>
            <p className="text-lg font-bold">{checkedStoreOrders} / {totalStoreOrders}</p>
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
              <SelectTrigger className="w-full sm:w-40">
                <User className="size-4 mr-2" />
                <SelectValue placeholder="担当者" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全員</SelectItem>
                {uniqueStaffNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
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
                              <TableHead className="w-20">担当</TableHead>
                              <TableHead>商品コード</TableHead>
                              <TableHead>商品名</TableHead>
                              <TableHead>カテゴリ</TableHead>
                              <TableHead className="text-right">合計数量</TableHead>
                              <TableHead className="text-right">本部在庫</TableHead>
                              <TableHead>店舗内訳（チェックで完了）</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.products.map((product) => {
                              const allChecked = isProductAllChecked(product)
                              return (
                                <TableRow
                                  key={product.product_id}
                                  className={allChecked ? "opacity-50 bg-muted/30" : ""}
                                >
                                  <TableCell>
                                    <Badge
                                      variant={
                                        product.assignedStaff === "浅野" ? "default" :
                                        product.assignedStaff === "金本" ? "secondary" :
                                        product.assignedStaff === "未設定" ? "outline" : "secondary"
                                      }
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
                                      {allChecked && (
                                        <CheckCircle2 className="size-4 text-green-600" />
                                      )}
                                      <span className={allChecked ? "line-through" : ""}>
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
                                    <div className="flex flex-wrap gap-2">
                                      {product.stores.map((store) => {
                                        const isChecked = checkedStores.has(store.checkKey)
                                        return (
                                          <label
                                            key={store.checkKey}
                                            className={`flex items-center gap-1.5 cursor-pointer rounded-md border px-2 py-1 transition-colors \${
                                              isChecked 
                                                ? "bg-green-100 border-green-500 text-green-700" 
                                                : "hover:bg-muted"
                                            }`}
                                          >
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={() => toggleStoreCheck(store.checkKey)}
                                              className="size-3.5"
                                            />
                                            <span className="text-xs font-medium">
                                              {store.store_name}: {store.quantity}
                                            </span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
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
