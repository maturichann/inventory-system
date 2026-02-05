export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background">
      <main className="min-h-dvh">
        <div className="mx-auto max-w-4xl p-6">{children}</div>
      </main>
    </div>
  )
}
