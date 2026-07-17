// =============================================
// 目標設定ページ
// =============================================
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import GoalList from "@/components/goals/GoalList";
import MonthSelector from "@/components/goals/MonthSelector";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function GoalsPage({ searchParams }: Props) {
  // キャッシュを完全に無効化してSupabaseから毎回新鮮なデータを取得する
  noStore();

  const { month } = await searchParams;

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const targetMonth = month ?? defaultMonth;

  const [year, mon] = targetMonth.split("-");
  const displayMonth = `${year}年${parseInt(mon)}月`;

  const supabase = await createClient();

  // ログイン中のユーザーを明示的に取得
  const { data: { user } } = await supabase.auth.getUser();

  // デバッグ用: サーバーログにユーザー情報とクエリ結果を出力
  console.log("[Goals] user:", user?.id ?? "未ログイン");
  console.log("[Goals] targetMonth:", targetMonth);

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("target_month", targetMonth)
    .eq("user_id", user?.id ?? "") // RLSのバックアップとして明示的にフィルタ
    .order("created_at", { ascending: true });

  // デバッグ用: エラーと取得件数を出力
  console.log("[Goals] error:", error);
  console.log("[Goals] count:", goals?.length ?? 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">目標設定</h1>
          <p className="text-sm text-gray-500">{displayMonth}</p>
        </div>
        <MonthSelector value={targetMonth} />
      </div>

      {/* デバッグ用エラー表示 (確認後に削除します) */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          DBエラー: {error.message}
        </div>
      )}

      <GoalList goals={goals ?? []} defaultMonth={targetMonth} />
    </div>
  );
}
