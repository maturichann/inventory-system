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
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <AlertTriangle className="size-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">在庫アラート</h4>
                      <p className="text-sm text-muted-foreground">本部在庫管理ONの商品で、在庫が閾値を下回ると自動でアラート表示。欠品を防ぎます。</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                      <Package className="size-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">最低発注金額チェック</h4>
                      <p className="text-sm text-muted-foreground">店舗発注時、メーカーごとの最低発注金額を下回るとアラートで止めます。</p>
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
                店舗スタッフ向けの発注方法をわかりやすく説明します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
                <h4 className="mb-2 flex items-center gap-2 font-bold text-red-800">
                  <AlertTriangle className="size-5" />
                  必ず守ってほしいこと
                </h4>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex gap-2"><span className="font-bold">①</span><span><strong>備考欄がある商品は、必ず備考を記入してください</strong>（カラー指定・サイズ・特記事項など、本部に伝えたいことを必ず書いてください）</span></li>
                  <li className="flex gap-2"><span className="font-bold">②</span><span>商品名をよく確認してください。<strong>カール・長さ・カラー違いで似た商品が多い</strong>です（例: NUMEROフラットラッシュカラー SCカール 9mm アイスモーヴ 等）</span></li>
                  <li className="flex gap-2"><span className="font-bold">③</span><span>送信前にカート内容を最終確認。<strong>送信すると本部に即届きます</strong></span></li>
                  <li className="flex gap-2"><span className="font-bold">④</span><span><strong>書類系（メールDM・のし紙など）は100枚単位</strong>で発注してください</span></li>
                  <li className="flex gap-2"><span className="font-bold">⑤</span><span>メーカーごとに<strong>最低発注金額</strong>があります。下回るとアラートが出て発注できません</span></li>
                </ul>
              </div>

              <div className="rounded-lg border bg-amber-50 p-4">
                <h4 className="mb-2 font-medium text-amber-800">ポイント</h4>
                <ul className="space-y-1 text-sm text-amber-700">
                  <li>• ログイン不要で、URLにアクセスするだけでOK</li>
                  <li>• スマートフォン・タブレットに最適化されています</li>
                  <li>• カテゴリ「全て」でもエクステは「商品ライン → カール → 長さ → カラー」の順に選びます</li>
                  <li>• 発注後でも「未処理」状態なら<strong>発注履歴から修正できます</strong>（処理中・完了は不可）</li>
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
                      title: "カテゴリを選ぶ",
                      desc: "「カテゴリ」から商品の種類を選びます。「全て」でも目的の商品が探せます。",
                      tips: "エクステは「ライン → カール → 長さ → カラー」の階層から選択します",
                    },
                    {
                      step: 3,
                      title: "商品を選択",
                      desc: "発注したい商品をタップしてカートに追加します。商品名は最後まで確認してから選んでください。",
                      tips: "似た商品が並ぶ場合は、カラー・長さ・カールの違いに注意",
                    },
                    {
                      step: 4,
                      title: "数量を入力",
                      desc: "＋/−ボタン、または直接数量を入力します。",
                      tips: "書類・メールDM・のし紙などは100枚単位（100, 200, 300 ...）で入力",
                    },
                    {
                      step: 5,
                      title: "備考を記入（重要）",
                      desc: "備考欄がある商品は、本部に伝えたいことを必ず書いてください。カラー指定・在庫優先順位など。",
                      tips: "備考欄が空だと本部で判断できないことがあります",
                    },
                    {
                      step: 6,
                      title: "金額エラーが出たら",
                      desc: "「最低発注金額に達していないメーカーがあります」が出たら、不足額分の商品を追加してください。",
                      tips: "メーカー単位で最低発注金額が決まっています",
                    },
                    {
                      step: 7,
                      title: "発注を送信",
                      desc: "カート内容を最終確認し「発注を送信」をタップ。発注番号が表示されたら完了です。",
                      tips: "発注番号はメモしておくと問い合わせ時に便利",
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

              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-base">発注後の修正方法</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>① 発注画面の上部タブ「<strong>発注履歴</strong>」をタップ</p>
                  <p>② 修正したい発注（<Badge variant="secondary">未処理</Badge>のもの）の「<strong>修正</strong>」ボタンをタップ</p>
                  <p>③ カートに発注内容が入るので、数量や備考を変えて「発注を送信」</p>
                  <p className="mt-2 rounded bg-amber-100 p-2 text-amber-800">
                    ※ <Badge variant="default" className="mx-1">処理中</Badge>または<Badge className="mx-1 bg-green-500">完了</Badge>の発注は修正できません。本部にご連絡ください。
                  </p>
                </CardContent>
              </Card>

              <Card className="border-rose-200 bg-rose-50/50">
                <CardHeader>
                  <CardTitle className="text-base">よくある間違い</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-rose-900">❌ 似た商品名を選び間違える</p>
                    <p className="text-muted-foreground">→ カール（SC/J/C）・長さ（9/10/11/12/MIX）・カラー名まで全部確認</p>
                  </div>
                  <div>
                    <p className="font-medium text-rose-900">❌ 書類を1枚単位で発注</p>
                    <p className="text-muted-foreground">→ 書類・メールDM・のし紙は<strong>100単位</strong>で発注（100, 200, 300...）</p>
                  </div>
                  <div>
                    <p className="font-medium text-rose-900">❌ 備考欄を空にしたまま送信</p>
                    <p className="text-muted-foreground">→ 備考欄がある商品は、必ず希望や注意点を記入</p>
                  </div>
                  <div>
                    <p className="font-medium text-rose-900">❌ 発注送信後の連絡を忘れる</p>
                    <p className="text-muted-foreground">→ 数量変更等は「発注履歴」から修正、処理中になったら本部に電話</p>
                  </div>
                </CardContent>
              </Card>
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
                    「購入リスト」画面でメーカー別に集計を確認。ECサイトやPDF出力（事務所・金本さん・べルシア向け）を活用し、店舗ごとのチェックボックスで進捗管理します。
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
                  各店舗からの発注を商品別に集計し、メーカー順に表示します。発注先ごとの仕入れ作業に使います。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">使い方</h4>
                <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>メーカーフィルター・検索で必要な商品を絞り込む</li>
                  <li>「PDF出力（事務所/金本さん/べルシア）」ボタンで仕入先別の購入リストを印刷</li>
                  <li>ECサイトや実店舗で購入</li>
                  <li>店舗ごとにチェックを入れて進捗管理</li>
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
                      "本部在庫管理ON/OFFの切替（在庫アラート対象を制御）",
                      "削除は論理削除（is_active=false）に統一",
                    ],
                  },
                  {
                    icon: Factory,
                    title: "メーカーマスター",
                    desc: "仕入先メーカーを管理します",
                    details: [
                      "メーカー名の登録",
                      "最低発注金額（minimum_order）の設定",
                      "購入リストでのグルーピングとPDF出力に使用",
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
                  <AccordionTrigger>店舗側で発注後に修正できますか？</AccordionTrigger>
                  <AccordionContent>
                    はい、<strong>未処理（pending）</strong>の発注のみ店舗側で修正できます。発注画面の「発注履歴」タブから対象の発注の「修正」ボタンを押すと、カートに内容が読み込まれて編集→再送信できます。処理中・完了の発注は本部にご連絡ください。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-8">
                  <AccordionTrigger>発注の履歴は確認できますか？</AccordionTrigger>
                  <AccordionContent>
                    はい、発注管理画面で過去の発注履歴を確認できます。ステータスや期間でフィルタリングして検索することも可能です。在庫の変動履歴も本部在庫画面から確認できます。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-9">
                  <AccordionTrigger>最低発注金額のチェックはどう動きますか？</AccordionTrigger>
                  <AccordionContent>
                    店舗からの発注送信時、メーカーごとに「単価×数量」で合計を計算し、メーカーマスターで設定された最低発注金額を下回ると、不足額をアラートで表示し送信を止めます。最低発注金額が0のメーカーはチェック対象外です。
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
