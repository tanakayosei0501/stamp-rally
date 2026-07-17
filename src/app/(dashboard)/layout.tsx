// =============================================
// ダッシュボード共通レイアウト
// ログイン後の全画面で使われます
// =============================================
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import BottomNav from "@/components/ui/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // サーバー側でログイン中のユーザー情報を取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-gray-800 text-sm">スタンプラリー</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {profile?.display_name ?? user?.email}
            </span>
            {/* ログアウトボタン */}
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-lg mx-auto px-4 pt-6">{children}</main>

      {/* ボトムナビゲーション */}
      <BottomNav />
    </div>
  );
}
