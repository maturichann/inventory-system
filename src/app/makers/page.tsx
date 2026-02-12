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
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Maker } from "@/types/database"

type MakerFormData = {
  group_code: string
  maker_name: string
  order_category: string
  minimum_order: string
}

const initialFormData: MakerFormData = {
  group_code: "",
  maker_name: "",
  order_category: "",
  minimum_order: "1",
}

export default function MakersPage() {
  const [makers, setMakers] = useState<Maker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMaker, setEditingMaker] = useState<Maker | null>(null)
  const [formData, setFormData] = useState<MakerFormData>(initialFormData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const fetchMakers = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("makers")
      .select("*")
      .order("group_code", { ascending: true })

    if (error) {
      console.error("Error fetching makers:", error)
    } else {
      setMakers(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchMakers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenDialog = (maker?: Maker) => {
    if (maker) {
      setEditingMaker(maker)
      setFormData({
        group_code: maker.group_code,
        maker_name: maker.maker_name,
        order_category: maker.order_category || "",
        minimum_order: maker.minimum_order.toString(),
      })
    } else {
      setEditingMaker(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingMaker(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    if (editingMaker) {
      const { error } = await supabase
        .from("makers")
        .update({
          group_code: formData.group_code,
          maker_name: formData.maker_name,
          order_category: formData.order_category || null,
          minimum_order: parseInt(formData.minimum_order) || 1,
        })
        .eq("id", editingMaker.id)

      if (error) {
        console.error("Error updating maker:", error)
        alert("更新に失敗しました")
      }
    } else {
      const { error } = await supabase
        .from("makers")
        .insert({
          group_code: formData.group_code,
          maker_name: formData.maker_name,
          order_category: formData.order_category || null,
          minimum_order: parseInt(formData.minimum_order) || 1,
        })

      if (error) {
        console.error("Error creating maker:", error)
        alert("登録に失敗しました")
      }
    }

    setIsSaving(false)
    handleCloseDialog()
    fetchMakers()
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("このメーカーを削除しますか？")) {
      const { error } = await supabase
        .from("makers")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting maker:", error)
        alert("削除に失敗しました")
      } else {
        fetchMakers()
      }
    }
  }

  const filteredMakers = makers.filter(maker =>
    maker.maker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    maker.group_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">メーカーマスター</h1>
          <p className="text-muted-foreground text-pretty">
            メーカーの登録・編集・削除を行います
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
              placeholder="メーカー名・グループコードで検索..."
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
          ) : filteredMakers.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <p className="text-sm">
                {makers.length === 0
                  ? "メーカーが登録されていません。「新規登録」からメーカーを追加してください。"
                  : "検索条件に一致するメーカーがありません。"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>グループコード</TableHead>
                  <TableHead>メーカー名</TableHead>
                  <TableHead>発注区分</TableHead>
                  <TableHead className="text-right tabular-nums">最低発注数</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMakers.map((maker) => (
                  <TableRow key={maker.id}>
                    <TableCell className="font-mono text-sm">{maker.group_code}</TableCell>
                    <TableCell className="font-medium">{maker.maker_name}</TableCell>
                    <TableCell>{maker.order_category || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{maker.minimum_order}</TableCell>
                    <TableCell>
                      <Badge variant={maker.is_active ? "success" : "secondary"}>
                        {maker.is_active ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(maker)}
                          aria-label="編集"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(maker.id)}
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
              {editingMaker ? "メーカーを編集" : "新規メーカー登録"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group_code">グループコード *</Label>
              <Input
                id="group_code"
                value={formData.group_code}
                onChange={(e) => setFormData({ ...formData, group_code: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maker_name">メーカー名 *</Label>
              <Input
                id="maker_name"
                value={formData.maker_name}
                onChange={(e) => setFormData({ ...formData, maker_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_category">発注区分</Label>
              <Input
                id="order_category"
                value={formData.order_category}
                onChange={(e) => setFormData({ ...formData, order_category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimum_order">最低発注数</Label>
              <Input
                id="minimum_order"
                type="number"
                min="1"
                value={formData.minimum_order}
                onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {editingMaker ? "更新" : "登録"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
