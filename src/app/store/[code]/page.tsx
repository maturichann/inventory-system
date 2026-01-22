"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, ShoppingCart, Loader2, Check, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Store, Product, Category } from "@/types/database"

type ProductWithCategory = Product & {
  categories: Category | null
}

type OrderItem = {
  product_id: string
  product_code: string
  product_name: string
  category_name: string
  quantity: number
}

export default function StoreOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [notFound, setNotFound] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      // Find store by code
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

      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select(`*, categories (*)`)
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

  const categories = [...new Set(products.map(p => p.categories?.name).filter(Boolean))]

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.categories?.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = (product: ProductWithCategory) => {
    // Check if already added
    if (orderItems.some(item => item.product_id === product.id)) {
      // Increment quantity
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
    }])
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

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId))
  }

  const handleSubmitOrder = async () => {
    if (!store || orderItems.length === 0) return

    setIsSubmitting(true)

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: store.id,
        status: "pending",
      })
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error("Error creating order:", orderError)
      alert("発注の送信に失敗しました")
      setIsSubmitting(false)
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
        console.error("Critical: Failed to rollback order:", deleteError, "Order ID:", newOrder.id)
        alert(`発注に失敗しました。管理者に連絡してください。(注文ID: ${newOrder.id})`)
      } else {
        alert("発注に失敗しました。もう一度お試しください。")
      }
      setIsSubmitting(false)
      return
    }

    setOrderNumber(newOrder.order_number)
    setIsSuccessDialogOpen(true)
    setOrderItems([])
    setIsSubmitting(false)
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
            <p className="text-sm text-muted-foreground">発注入力画面</p>
          </div>
          {orderItems.length > 0 && (
            <Badge variant="default" className="text-base px-3 py-1">
              <ShoppingCart className="size-4 mr-1" />
              {orderItems.length}点
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Product Selection */}
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
              </CardContent>
            </Card>
          </div>

          {/* Order Cart */}
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
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div
                          key={item.product_id}
                          className="flex items-center gap-2 rounded-md border p-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">{item.product_code}</p>
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
                              onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 0)}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            onClick={() => handleRemoveItem(item.product_id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
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
      </main>

      {/* Success Dialog */}
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
    </div>
  )
}
