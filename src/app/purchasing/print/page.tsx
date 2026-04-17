"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

type PrintItem = {
  product_id: string
  product_code: string
  product_name: string
  level1: string | null
  level2: string | null
  level3: string | null
  level4: string | null
  level5: string | null
  level6: string | null
  level7: string | null
  level8: string | null
  maker_name: string
  maker_id: string
  supplier: string | null
  store_name: string
  store_code: string
  order_number: string
  quantity: number
  notes: string | null
}

type StoreBreakdown = {
  store_name: string
  store_code: string
  quantity: number
  notes: string | null
}

type ProductRow = {
  product_id: string
  product_code: string
  product_name: string
  levels: string[]
  maker_name: string
  maker_id: string
  total_quantity: number
  stores: StoreBreakdown[]
}

type MakerBlock = {
  maker_id: string
  maker_name: string
  products: ProductRow[]
}

function PrintPageContent() {
  const searchParams = useSearchParams()
  const supplier = searchParams.get("supplier") ?? ""
  const [makerBlocks, setMakerBlocks] = useState<MakerBlock[]>([])
  const [isLoading, setIsLoading] = useState(!!supplier)
  const [totalItems, setTotalItems] = useState(0)
  const [totalQuantity, setTotalQuantity] = useState(0)

  useEffect(() => {
    if (!supplier) return

    const supabase = createClient()
    let cancelled = false

    const fetchData = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          product_id,
          quantity,
          fulfilled_from,
          notes,
          orders!inner (
            id,
            order_number,
            status,
            stores ( id, store_name, store_code )
          ),
          products!inner (
            id,
            product_code,
            product_name,
            supplier,
            level1, level2, level3, level4, level5, level6, level7, level8,
            makers ( id, maker_name )
          )
        `)
        .eq("products.supplier", supplier)
        .in("orders.status", ["pending", "processing"])
        .or("fulfilled_from.eq.supplier,fulfilled_from.is.null")

      if (cancelled) return

      if (error) {
        console.error("fetch error", error)
        setIsLoading(false)
        return
      }

      const items: PrintItem[] = (data ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((row: any) => row.products && row.orders)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((row: any) => ({
          product_id: row.product_id,
          product_code: row.products?.product_code ?? "",
          product_name: row.products?.product_name ?? "",
          level1: row.products?.level1 ?? null,
          level2: row.products?.level2 ?? null,
          level3: row.products?.level3 ?? null,
          level4: row.products?.level4 ?? null,
          level5: row.products?.level5 ?? null,
          level6: row.products?.level6 ?? null,
          level7: row.products?.level7 ?? null,
          level8: row.products?.level8 ?? null,
          maker_name: row.products?.makers?.maker_name ?? "未設定",
          maker_id: row.products?.makers?.id ?? "unknown",
          supplier: row.products?.supplier ?? null,
          store_name: row.orders?.stores?.store_name ?? "",
          store_code: row.orders?.stores?.store_code ?? "",
          order_number: row.orders?.order_number ?? "",
          quantity: row.quantity ?? 0,
          notes: row.notes ?? null,
        }))

      const productMap = new Map<string, ProductRow>()
      for (const it of items) {
        const levels = [it.level1, it.level2, it.level3, it.level4, it.level5, it.level6, it.level7, it.level8]
          .filter((v): v is string => !!v && v.length > 0)
        const existing = productMap.get(it.product_id)
        if (existing) {
          existing.total_quantity += it.quantity
          const s = existing.stores.find(x => x.store_code === it.store_code)
          if (s) {
            s.quantity += it.quantity
            if (it.notes) {
              s.notes = s.notes ? (s.notes === it.notes ? s.notes : `${s.notes} / ${it.notes}`) : it.notes
            }
          } else {
            existing.stores.push({
              store_name: it.store_name,
              store_code: it.store_code,
              quantity: it.quantity,
              notes: it.notes,
            })
          }
        } else {
          productMap.set(it.product_id, {
            product_id: it.product_id,
            product_code: it.product_code,
            product_name: it.product_name,
            levels,
            maker_name: it.maker_name,
            maker_id: it.maker_id,
            total_quantity: it.quantity,
            stores: [{
              store_name: it.store_name,
              store_code: it.store_code,
              quantity: it.quantity,
              notes: it.notes,
            }],
          })
        }
      }

      const products = Array.from(productMap.values())
      products.sort((a, b) => a.product_name.localeCompare(b.product_name, "ja"))

      const blockMap = new Map<string, MakerBlock>()
      for (const p of products) {
        const block = blockMap.get(p.maker_id)
        if (block) {
          block.products.push(p)
        } else {
          blockMap.set(p.maker_id, {
            maker_id: p.maker_id,
            maker_name: p.maker_name,
            products: [p],
          })
        }
      }
      const blocks = Array.from(blockMap.values())
      blocks.sort((a, b) => a.maker_name.localeCompare(b.maker_name, "ja"))

      if (cancelled) return

      setMakerBlocks(blocks)
      setTotalItems(products.length)
      setTotalQuantity(products.reduce((sum, p) => sum + p.total_quantity, 0))
      setIsLoading(false)
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [supplier])

  useEffect(() => {
    if (!isLoading && makerBlocks.length > 0) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [isLoading, makerBlocks])

  const today = new Date()
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="print-root">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm 10mm;
          }
          html, body {
            background: #fff !important;
          }
          .no-print { display: none !important; }
          .print-root { color: #000; }
          .maker-block { break-inside: avoid; page-break-inside: avoid; }
          tr { break-inside: avoid; page-break-inside: avoid; }
        }
        .print-root {
          font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif;
          color: #111;
          padding: 16px;
          max-width: 210mm;
          margin: 0 auto;
          background: #fff;
        }
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid #111;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        .print-title { font-size: 20px; font-weight: 700; margin: 0; }
        .print-meta { font-size: 12px; color: #444; text-align: right; }
        .maker-block { margin-bottom: 20px; }
        .maker-name {
          font-size: 14px;
          font-weight: 700;
          background: #eee;
          padding: 4px 8px;
          border-left: 4px solid #111;
          margin-bottom: 6px;
        }
        table.print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        table.print-table th, table.print-table td {
          border: 1px solid #999;
          padding: 4px 6px;
          vertical-align: top;
          text-align: left;
        }
        table.print-table th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .qty { text-align: right; font-weight: 600; white-space: nowrap; }
        .stores { font-size: 10px; color: #333; }
        .print-toolbar {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: #f8f8f8;
          border-bottom: 1px solid #ddd;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .print-toolbar button {
          padding: 6px 14px;
          border: 1px solid #888;
          background: #fff;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .print-toolbar button:hover { background: #eee; }
        .empty-state {
          text-align: center;
          padding: 48px 16px;
          color: #666;
        }
      `}</style>

      <div className="print-toolbar no-print">
        <button onClick={() => window.print()}>印刷 / PDF保存</button>
        <button onClick={() => window.close()}>閉じる</button>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#666", alignSelf: "center" }}>
          印刷ダイアログで「送信先」を「PDFに保存」にするとPDFになります
        </div>
      </div>

      <div className="print-header">
        <div>
          <h1 className="print-title">購入リスト — {supplier || "（仕入先未指定）"}</h1>
        </div>
        <div className="print-meta">
          <div>発行日: {dateStr}</div>
          <div>商品点数: {totalItems} 品目 / 合計数量: {totalQuantity} 点</div>
        </div>
      </div>

      {makerBlocks.length === 0 ? (
        <div className="empty-state">該当する発注データがありません。</div>
      ) : (
        makerBlocks.map(block => (
          <div key={block.maker_id} className="maker-block">
            <div className="maker-name">{block.maker_name}</div>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: "16%" }}>商品コード</th>
                  <th>商品名</th>
                  <th style={{ width: "22%" }}>仕様</th>
                  <th style={{ width: "8%" }}>数量</th>
                  <th style={{ width: "28%" }}>店舗内訳</th>
                </tr>
              </thead>
              <tbody>
                {block.products.map(p => (
                  <tr key={p.product_id}>
                    <td>{p.product_code}</td>
                    <td>{p.product_name}</td>
                    <td>{p.levels.join(" / ")}</td>
                    <td className="qty">{p.total_quantity}</td>
                    <td className="stores">
                      {p.stores.map((s, i) => (
                        <span key={s.store_code}>
                          {i > 0 && "、"}
                          {s.store_name}: {s.quantity}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}

export default function PurchasingPrintPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <PrintPageContent />
    </Suspense>
  )
}
