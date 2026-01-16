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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Staff } from "@/types/database"

type StaffFormData = {
  name: string
  email: string
  role: string
}

const initialFormData: StaffFormData = {
  name: "",
  email: "",
  role: "staff",
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState<StaffFormData>(initialFormData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const fetchStaff = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching staff:", error)
    } else {
      setStaffList(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchStaff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenDialog = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff)
      setFormData({
        name: staff.name,
        email: staff.email || "",
        role: staff.role,
      })
    } else {
      setEditingStaff(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingStaff(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    if (editingStaff) {
      const { error } = await supabase
        .from("staff")
        .update({
          name: formData.name,
          email: formData.email || null,
          role: formData.role,
        })
        .eq("id", editingStaff.id)

      if (error) {
        console.error("Error updating staff:", error)
        alert("更新に失敗しました")
      }
    } else {
      const { error } = await supabase
        .from("staff")
        .insert({
          name: formData.name,
          email: formData.email || null,
          role: formData.role,
        })

      if (error) {
        console.error("Error creating staff:", error)
        alert("登録に失敗しました")
      }
    }

    setIsSaving(false)
    handleCloseDialog()
    fetchStaff()
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("この担当者を削除しますか？")) {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting staff:", error)
        alert("削除に失敗しました")
      } else {
        fetchStaff()
      }
    }
  }

  const filteredStaff = staffList.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (staff.email && staff.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">管理者</Badge>
      case "staff":
        return <Badge variant="secondary">スタッフ</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance">担当者マスター</h1>
          <p className="text-muted-foreground text-pretty">
            発注担当者の登録・編集・削除を行います
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
              placeholder="名前・メールで検索..."
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
          ) : filteredStaff.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <p className="text-sm">
                {staffList.length === 0
                  ? "担当者が登録されていません。「新規登録」から担当者を追加してください。"
                  : "検索条件に一致する担当者がいません。"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>役割</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.email || "-"}</TableCell>
                    <TableCell>{getRoleBadge(staff.role)}</TableCell>
                    <TableCell>
                      <Badge variant={staff.is_active ? "success" : "secondary"}>
                        {staff.is_active ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(staff)}
                          aria-label="編集"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(staff.id)}
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
              {editingStaff ? "担当者を編集" : "新規担当者登録"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">役割</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="役割を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理者</SelectItem>
                  <SelectItem value="staff">スタッフ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {editingStaff ? "更新" : "登録"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
