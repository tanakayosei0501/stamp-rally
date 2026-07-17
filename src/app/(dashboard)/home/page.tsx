// =============================================
// ホーム画面 - 今月のスタンプラリー
// =============================================
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GoalStampCard from "@/components/goals/GoalStampCard";
import type { Achievement } from "@/types/database";

export default async function HomePage() {
  noStore(); // 毎回必ずDBから最新データを取得する

  // タイムゾーンずれを防ぐため文字列で今日の日付を組み立てる
  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-"); // "2026-07-17"
  const currentMonth = todayStr.slice(0, 7); // "2026-07"
  const displayMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 今月の目標と、それぞれの達成記録を一括取得
  const { data: goals } = await supabase
    .from("goals")
    .select("*, achievements(*)")
    .eq("target_month", currentMonth)
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: true });

  // 全目標の合計スタンプ数
  const totalStamps = goals?.reduce(
    (sum, g) => sum + ((g.achievements as Achievement[])?.filter((a) => a.achieved).length ?? 0),
    0
  ) ?? 0;

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">今月のスタンプラリー</h1>
        <p className="text-sm text-gray-500">{displayMonth}</p>
      </div>

      {/* サマリーカード */}
      {goals && goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-orange-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-500">{goals.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">今月の目標</div>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">{totalStamps}<span className="text-xl ml-1">⭐</span></div>
            <div className="text-xs text-gray-500 mt-0.5">獲得スタンプ</div>
          </div>
        </div>
      )}

      {/* 目標カード一覧 */}
      {!goals || goals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-gray-600 font-medium">今月の目標がまだありません</p>
          <p className="text-gray-400 text-sm mt-2 mb-6">
            目標を設定してスタンプラリーを始めよう！
          </p>
          <Link
            href="/goals"
            className="inline-block bg-orange-400 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            目標を設定する
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalStampCard
              key={goal.id}
              goal={goal}
              achievements={(goal.achievements as Achievement[]) ?? []}
              todayStr={todayStr}
            />
          ))}
        </div>
      )}
    </div>
  );
}
