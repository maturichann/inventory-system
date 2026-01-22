"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Store,
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  Factory,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Smartphone,
  Monitor,
  ChevronRight,
} from "lucide-react"

type Section = "overview" | "store" | "hq" | "master" | "faq"

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview")

  const sections = [
    { id: "overview" as Section, label: "システム概要", icon: BookOpen },
    { id: "store" as Section, label: "店舗向け", icon: Store },
    { id: "hq" as Section, label: "本部向け", icon: Monitor },
    { id: "master" as Section, label: "マスター管理", icon: Package },
    { id: "faq" as Section, label: "よくある質問", icon: HelpCircle },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">操作マニュアル</h1>
        <p className="text-muted-foreground">
          システムの使い方をわかりやすく解説します
        </p>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              onClick={() => setActiveSection(section.id)}
              className="gap-2"
            >
              <Icon className="size-4" />
              {section.label}
            </Button>
          )
        })}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>システム概要</CardTitle>
              <CardDescription>
                在庫管理・発注システムの全体像を説明します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-blue-900">このシステムでできること</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <ShoppingCart className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">かんたん発注</h4>
                      <p className="text-sm text-muted-foreground">店舗スタッフはURLにアクセスするだけ。ログイン不要で簡単に発注できます。</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <BarChart3 className="size-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">自動集計</h4>
                      <p className="text-sm text-muted-foreground">各店舗からの発注を商品別・メーカー別に自動集計します。</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                      <Users className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">担当者振り分け</h4>
                      <p className="text-sm text-muted-foreground">本部在庫の有無に応じて、購入担当者を自動で振り分けます。</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <AlertTriangle className="size-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">在庫アラート</h4>
                      <p className="text-sm text-muted-foreground">在庫が閾値を下回ると自動でアラート表示。欠品を防ぎます。</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">業務の流れ</h3>
                <div className="relative">
                  <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200" />
                  <div className="space-y-6">
                    {[
                      { step: 1, title: "店舗で発注", desc: "店舗スタッフが専用URLから商品を選んで発注", color: "bg-blue-500" },
                      { step: 2, title: "本部で確認", desc: "発注管理画面で新規発注を確認", color: "bg-blue-500" },
                      { step: 3, title: "処理開始", desc: "本部在庫を確認し、出荷元（本部/仕入先）を決定", color: "bg-blue-500" },
                      { step: 4, title: "購入作業", desc: "購入リストを見ながらECサイトで購入", color: "bg-blue-500" },
                      { step: 5, title: "入庫処理", desc: "届いた商品を本部在庫に入庫登録", color: "bg-green-500" },
                      { step: 6, title: "完了処理", desc: "発注を完了にして在庫を自動反映、店舗へ発送", color: "bg-green-500" },
                    ].map((item) => (
                      <div key={item.step} className="relative flex gap-4 pl-12">
                        <div className={`absolute left-4 flex size-5 -translate-x-1/2 items-center justify-center rounded-full ${item.color} text-xs font-bold text-white`}>
                          {item.step}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>担当者の自動振り分けルール</CardTitle>
              <CardDescription>
                購入リストで表示される担当者の決定ロジック
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-medium">条件</th>
                      <th className="p-3 text-left font-medium">担当者</th>
                      <th className="p-3 text-left font-medium">理由</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">本部在庫がある</td>
                      <td className="p-3"><Badge variant="default">浅野さん</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground">本部から直接出荷するため</td>
                    </tr>
                    <tr>
                      <td className="p-3">本部在庫がない</td>
                      <td className="p-3"><Badge variant="secondary">商品の担当者設定</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground">ECサイトから購入するため</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                ※ 商品マスターで設定した「担当者ラベル」が、本部在庫がない場合のデフォルト担当者として使用されます。
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Store Section */}
      {activeSection === "store" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="size-5" />
                店舗発注画面の使い方
              </CardTitle>
              <CardDescription>
                店舗スタッフ向けの発注方法を説明します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-amber-50 p-4">
                <h4 className="mb-2 font-medium text-amber-800">ポイント</h4>
                <ul className="space-y-1 text-sm text-amber-700">
                  <li>• ログイン不要で、URLにアクセスするだけでOK</li>
                  <li>• スマートフォン・タブレットに最適化されています</li>
                  <li>• 発注は約1分で完了します</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">発注手順</h3>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "発注画面にアクセス",
                      desc: "店舗専用のURLにアクセスします。QRコードからも可能です。",
                      tips: "URLは店舗マスター画面で確認できます",
                    },
                    {
                      step: 2,
                      title: "商品を選択",
                      desc: "発注したい商品をタップしてカートに追加します。",
                      tips: "検索やカテゴリ絞り込みで素早く見つけられます",
                    },
                    {
                      step: 3,
                      title: "数量を調整",
                      desc: "＋/−ボタン、または直接数字を入力して数量を設定します。",
                      tips: "同じ商品をタップすると数量が増えます",
                    },
                    {
                      step: 4,
                      title: "発注を送信",
                      desc: "カートの内容を確認し、「発注を送信」ボタンをタップします。",
                      tips: "送信前に内容をよく確認してください",
                    },
                    {
                      step: 5,
                      title: "完了",
                      desc: "発注番号が表示されたら完了です。",
                      tips: "発注番号は控えておくと問い合わせ時に便利です",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 rounded-lg border p-4">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                        <p className="mt-1 text-xs text-blue-600">💡 {item.tips}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HQ Section */}
      {activeSection === "hq" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                発注管理
              </CardTitle>
              <CardDescription>
                店舗からの発注を確認・処理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium">発注のステータス</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">未処理</Badge>
                  <ChevronRight className="size-4 text-muted-foreground" />
                  <Badge variant="default">処理中</Badge>
                  <ChevronRight className="size-4 text-muted-foreground" />
                  <Badge className="bg-green-500">完了</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">操作手順</h4>
                <div className="rounded-lg border p-4">
                  <h5 className="mb-2 font-medium text-blue-600">1. 処理開始</h5>
                  <p className="text-sm text-muted-foreground">
                    発注の詳細を開き「処理開始」をクリック。本部在庫を確認し、各商品の出荷元（本部在庫/仕入先）が自動決定されます。
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h5 className="mb-2 font-medium text-blue-600">2. 購入作業</h5>
                  <p className="text-sm text-muted-foreground">
                    「購入リスト」画面に移動し、担当者でフィルタリング。ECサイトで購入し、チェックボックスで進捗管理します。
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h5 className="mb-2 font-medium text-green-600">3. 完了処理</h5>
                  <p className="text-sm text-muted-foreground">
                    商品が揃ったら発注詳細から「完了」をクリック。本部在庫から出荷した分は自動で在庫が減算されます。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5" />
                購入リスト
              </CardTitle>
              <CardDescription>
                ECサイトで購入する際に使う画面です
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-800">この画面の目的</h4>
                <p className="text-sm text-blue-700">
                  各店舗からの発注を商品別に集計し、メーカー順に表示します。担当者でフィルタリングして、自分が購入すべき商品だけを表示できます。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">使い方</h4>
                <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>担当者フィルターで自分の担当分を絞り込む</li>
                  <li>メーカー別にECサイトで購入</li>
                  <li>購入したらチェックボックスにチェック</li>
                  <li>進捗が画面上部に表示される</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                本部在庫管理
              </CardTitle>
              <CardDescription>
                本部在庫の確認・入出庫・調整を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <div className="mb-2 text-2xl">📥</div>
                  <h4 className="font-medium">入庫</h4>
                  <p className="text-xs text-muted-foreground">ECサイトから届いた商品を登録</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="mb-2 text-2xl">📤</div>
                  <h4 className="font-medium">出庫</h4>
                  <p className="text-xs text-muted-foreground">店舗へ発送した分を減らす</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="mb-2 text-2xl">📝</div>
                  <h4 className="font-medium">調整</h4>
                  <p className="text-xs text-muted-foreground">棚卸しなどで数量を修正</p>
                </div>
              </div>

              <div className="rounded-lg border bg-green-50 p-4">
                <h4 className="mb-2 font-medium text-green-800">EC購入品の入庫手順</h4>
                <ol className="list-inside list-decimal space-y-1 text-sm text-green-700">
                  <li>本部在庫画面を開く</li>
                  <li>届いた商品を検索して見つける</li>
                  <li>「入庫」ボタンをクリック</li>
                  <li>届いた数量を入力</li>
                  <li>理由欄に「EC購入入荷」などを記入して登録</li>
                </ol>
              </div>

              <div className="rounded-lg border bg-orange-50 p-4">
                <h4 className="mb-2 font-medium text-orange-800">在庫アラートについて</h4>
                <p className="text-sm text-orange-700">
                  在庫数が閾値を下回ると「要発注」としてアラート表示されます。閾値は商品ごとに設定できます（デフォルト: 5）。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Master Section */}
      {activeSection === "master" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>マスター管理</CardTitle>
              <CardDescription>
                システムの基本データを管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    icon: Package,
                    title: "商品マスター",
                    desc: "商品の登録・編集を行います",
                    details: [
                      "商品コード・商品名の設定",
                      "カテゴリ・メーカーの紐付け",
                      "担当者ラベルの設定（本部在庫がない時の購入担当）",
                    ],
                  },
                  {
                    icon: Factory,
                    title: "メーカーマスター",
                    desc: "仕入先メーカーを管理します",
                    details: [
                      "メーカー名の登録",
                      "購入リストでのグルーピングに使用",
                    ],
                  },
                  {
                    icon: Store,
                    title: "店舗マスター",
                    desc: "店舗情報を管理します",
                    details: [
                      "店舗名・店舗コードの設定",
                      "発注用URLの確認・コピー",
                      "店舗の有効/無効の切り替え",
                    ],
                  },
                  {
                    icon: Users,
                    title: "担当者マスター",
                    desc: "購入担当者を管理します",
                    details: [
                      "担当者名の登録",
                      "商品マスターでの担当者ラベル選択に使用",
                    ],
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <Icon className="size-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="mb-2 text-sm text-muted-foreground">{item.desc}</p>
                          <ul className="space-y-1">
                            {item.details.map((detail, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="size-3 text-green-500" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FAQ Section */}
      {activeSection === "faq" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="size-5" />
                よくある質問
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>発注を間違えた場合はどうすればいいですか？</AccordionTrigger>
                  <AccordionContent>
                    本部の発注管理画面から、該当の発注を確認・編集できます。処理開始前であれば、明細の変更やキャンセルが可能です。処理開始後の場合は、管理者にご連絡ください。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>在庫の閾値はどこで設定しますか？</AccordionTrigger>
                  <AccordionContent>
                    本部在庫画面で、商品ごとに閾値を設定できます。在庫数がこの閾値を下回ると、「要発注」としてアラートが表示されます。デフォルトは5に設定されています。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>複数店舗から同じ商品の発注があった場合は？</AccordionTrigger>
                  <AccordionContent>
                    購入リスト画面で商品別に自動集計されます。必要な総数量が表示されるため、まとめて購入できます。どの店舗がいくつ発注したかの内訳も確認可能です。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>スマートフォンからも操作できますか？</AccordionTrigger>
                  <AccordionContent>
                    はい、すべての画面がスマートフォン・タブレットに対応しています。特に店舗発注画面はモバイル操作を意識した設計になっており、タップだけで簡単に発注できます。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>ECサイトで購入した商品が届いたら？</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">本部在庫画面で入庫処理を行います。</p>
                    <ol className="list-inside list-decimal space-y-1 text-sm">
                      <li>本部在庫画面を開く</li>
                      <li>届いた商品を検索して見つける</li>
                      <li>「入庫」ボタンをクリック</li>
                      <li>届いた数量を入力し、理由欄に「EC購入入荷」などを記入</li>
                      <li>登録すると在庫数が更新され、履歴にも記録されます</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>店舗の発注URLはどこで確認できますか？</AccordionTrigger>
                  <AccordionContent>
                    店舗マスター画面で確認できます。各店舗の行にURLコピーボタンがあり、クリックするとクリップボードにコピーされます。このURLをQRコードにして店舗に掲示することも可能です。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger>担当者の振り分けはどうやって決まりますか？</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">以下のルールで自動決定されます：</p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      <li><strong>本部在庫がある場合</strong>：浅野さんが担当（本部から直接出荷）</li>
                      <li><strong>本部在庫がない場合</strong>：商品マスターで設定した担当者が担当（EC購入）</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-8">
                  <AccordionTrigger>発注の履歴は確認できますか？</AccordionTrigger>
                  <AccordionContent>
                    はい、発注管理画面で過去の発注履歴を確認できます。ステータスや期間でフィルタリングして検索することも可能です。在庫の変動履歴も本部在庫画面から確認できます。
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
