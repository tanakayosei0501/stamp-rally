// =============================================
// ダッシュボード共通レイアウト
// ホーム/目標/グループ/履歴 の全画面で使うナビゲーションバーを含みます
// =============================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* メインコンテンツ */}
      <main className="max-w-lg mx-auto px-4 pt-6">{children}</main>

      {/* ボトムナビゲーション (スマホ用) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex">
          <a
            href="/home"
            className="flex-1 flex flex-col items-center py-3 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <span className="text-xl mb-0.5">🏠</span>
            ホーム
          </a>
          <a
            href="/goals"
            className="flex-1 flex flex-col items-center py-3 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <span className="text-xl mb-0.5">🎯</span>
            目標
          </a>
          <a
            href="/groups"
            className="flex-1 flex flex-col items-center py-3 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <span className="text-xl mb-0.5">👥</span>
            グループ
          </a>
          <a
            href="/history"
            className="flex-1 flex flex-col items-center py-3 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <span className="text-xl mb-0.5">📅</span>
            履歴
          </a>
        </div>
      </nav>
    </div>
  );
}
