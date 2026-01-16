"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, AlertTriangle, Printer, ShoppingCart, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Product, Category, HqInventory, Maker, Staff } from "@/types/database"

type AlertItem = Product & {
  hq_inventory: HqInventory | null
  categories: Category | null
  makers: Maker | null
  staff: Staff | null
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStaff, setSelectedStaff] = useState<string>("all")

  const supabase = createClient()

  const fetchAlerts = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        hq_inventory (*),
        categories (*),
        makers (*),
        staff (*)
      `)
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching alerts:", error)
    } else if (data) {
      // Filter products where quantity <= threshold
      const lowStockItems = (data as AlertItem[]).filter(item => {
        const quantity = item.hq_inventory?.quantity ?? 0
        const threshold = item.hq_inventory?.threshold ?? 5
        return quantity <= threshold
      })
      setAlerts(lowStockItems)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = [...new Set(alerts.map(item => item.categories?.name).filter(Boolean))]
  const staffList = [...new Set(alerts.map(item => item.staff?.name).filter(Boolean))]

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.product_code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || alert.categories?.name === selectedCategory
    const matchesStaff = selectedStaff === "all" || alert.staff?.name === selectedStaff
    return matchesSearch && matchesCategory && matchesStaff
  })

  const handlePrint = () => {
    window.print()
  }

  const getSeverityBadge = (current: number, threshold: number) => {
    const ratio = threshold > 0 ? current / threshold : 0
    if (ratio <= 0.25) {
      return <Badge variant="destructive">緊急</Badge>
    }
    if (ratio <= 0.5) {
      return <Badge variant="warning">警告</Badge>
    }
    return <Badge variant="outline">注意</Badge>
  }

  const getShortage = (item: AlertItem) => {
    const quantity = item.hq_inventory?.quantity ?? 0
    const threshold = item.hq_inventory?.threshold ?? 5
    return Math.max(0, threshold - quantity)
  }

  const urgentCount = alerts.filter(a => {
    const quantity = a.hq_inventory?.quantity ?? 0
    const threshold = a.hq_inventory?.threshold ?? 5
    return threshold > 0 && quantity / threshold <= 0.25
  }).length

  const warningCount = alerts.filter(a => {
    const quantity = a.hq_inventory?.quantity ?? 0
    const threshold = a.hq_inventory?.threshold ?? 5
    const ratio = threshold > 0 ? quantity / threshold : 0
    return ratio > 0.25 && ratio <= 0.5
  }).length

  const totalShortage = alerts.reduce((sum, a) => sum + getShortage(a), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-balance">
            <AlertTriangle className="size-6 text-destructive" />
            在庫アラート
          </h1>
          <p className="text-muted-foreground text-pretty">
            閾値を下回っている商品の一覧です
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="size-4" />
            印刷
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 no-print">
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">アラート件数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-destructive">{alerts.length}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">緊急</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-red-600">
              {urgentCount}件
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">警告</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-yellow-600">
              {warningCount}件
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総不足数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {totalShortage}個
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
                placeholder="商品名・商品コードで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="カテゴリ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category!}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="担当者" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {staffList.map((staff) => (
                  <SelectItem key={staff} value={staff!}>
                    {staff}
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
          ) : filteredAlerts.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <p className="text-sm">
                {alerts.length === 0
                  ? "アラートはありません"
                  : "検索条件に一致するアラートがありません"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>重要度</TableHead>
                  <TableHead>商品コード</TableHead>
                  <TableHead>商品名</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>メーカー</TableHead>
                  <TableHead className="text-right tabular-nums">現在庫</TableHead>
                  <TableHead className="text-right tabular-nums">閾値</TableHead>
                  <TableHead className="text-right tabular-nums">不足</TableHead>
                  <TableHead>担当</TableHead>
                  <TableHead className="w-32 no-print">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => {
                  const quantity = alert.hq_inventory?.quantity ?? 0
                  const threshold = alert.hq_inventory?.threshold ?? 5
                  const shortage = getShortage(alert)
                  return (
                    <TableRow key={alert.id} className="bg-destructive/5">
                      <TableCell>{getSeverityBadge(quantity, threshold)}</TableCell>
                      <TableCell className="font-mono text-sm">{alert.product_code}</TableCell>
                      <TableCell className="font-medium">{alert.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{alert.categories?.name || "-"}</Badge>
                      </TableCell>
                      <TableCell>{alert.makers?.maker_name || "-"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-destructive">
                        {quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {threshold}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        -{shortage}
                      </TableCell>
                      <TableCell>
                        {alert.staff ? (
                          <Badge variant="outline">{alert.staff.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="no-print">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to inventory page for this product
                            window.location.href = `/inventory?product=${alert.id}`
                          }}
                        >
                          <ShoppingCart className="size-3" />
                          入庫
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {staffList.length > 0 && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle className="text-lg">担当者別サマリー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {staffList.map((staff) => {
                const staffAlerts = alerts.filter(a => a.staff?.name === staff)
                const staffShortage = staffAlerts.reduce((sum, a) => sum + getShortage(a), 0)
                return (
                  <div key={staff} className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{staff}</h3>
                      <Badge variant="destructive">{staffAlerts.length}件</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      総不足数: {staffShortage}個
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[...new Set(staffAlerts.map(a => a.categories?.name).filter(Boolean))].map(cat => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
