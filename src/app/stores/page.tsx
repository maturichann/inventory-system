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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Pencil, Trash2, Loader2, Copy, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Store } from "@/types/database"

type StoreFormData = {
  store_code: string
  store_name: string
}

const initialFormData: StoreFormData = {
  store_code: "",
  store_name: "",
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState<StoreFormData>(initialFormData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const fetchStores = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching stores:", error)
    } else {
      setStores(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchStores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenDialog = (store?: Store) => {
    if (store) {
      setEditingStore(store)
      setFormData({
        store_code: store.store_code,
        store_name: store.store_name,
      })
    } else {
      setEditingStore(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingStore(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    if (editingStore) {
      const { error } = await supabase
        .from("stores")
        .update({
          store_code: formData.store_code,
          store_name: formData.store_name,
        })
        .eq("id", editingStore.id)

      if (error) {
        console.error("Error updating store:", error)
        alert("更新に失敗しました")
      }
    } else {
      const { error } = await supabase
        .from("stores")
        .insert({
          store_code: formData.store_code,
          store_name: formData.store_name,
        })

      if (error) {
        console.error("Error creating store:", error)
        alert("登録に失敗しました")
      }
    }

    setIsSaving(false)
    handleCloseDialog()
    fetchStores()
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("この店舗を削除しますか？")) {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting store:", error)
        alert("削除に失敗しました")
      } else {
        fetchStores()
      }
    }
  }

  const filteredStores = stores.filter(store =>
    store.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.store_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getOrderUrl = (storeCode: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/store/${storeCode}`
    }
    return `/store/${storeCode}`
  }

  const handleCopyUrl = async (storeCode: string) => {
    const url = getOrderUrl(storeCode)
    try {
      await navigator.clipboard.writeText(url)
      alert("発注URLをコピーしました")
    } catch {
      alert("コピーに失敗しました")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">店舗マスター</h1>
          <p className="text-muted-foreground text-pretty">
            店舗の登録・編集・削除を行います
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          新規登録
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="店舗名・店舗コードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <p className="text-sm">
                {stores.length === 0
                  ? "店舗が登録されていません。「新規登録」から店舗を追加してください。"
                  : "検索条件に一致する店舗がありません。"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>店舗コード</TableHead>
                  <TableHead>店舗名</TableHead>
                  <TableHead>発注URL</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-mono text-sm">{store.store_code}</TableCell>
                    <TableCell className="font-medium">{store.store_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          /store/{store.store_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleCopyUrl(store.store_code)}
                          aria-label="URLをコピー"
                        >
                          <Copy className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => window.open(getOrderUrl(store.store_code), "_blank")}
                          aria-label="発注画面を開く"
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={store.is_active ? "success" : "secondary"}>
                        {store.is_active ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(store)}
                          aria-label="編集"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(store.id)}
                          aria-label="削除"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStore ? "店舗を編集" : "新規店舗登録"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store_code">店舗コード *</Label>
              <Input
                id="store_code"
                value={formData.store_code}
                onChange={(e) => setFormData({ ...formData, store_code: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_name">店舗名 *</Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {editingStore ? "更新" : "登録"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
