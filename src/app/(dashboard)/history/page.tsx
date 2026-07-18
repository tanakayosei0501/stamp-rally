// =============================================
// 履歴ページ
// 過去の月を選んで達成状況を振り返る
// =============================================
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import HistoryMonthSelector from "@/components/history/HistoryMonthSelector";
import HistoryGoalCard from "@/components/history/HistoryGoalCard";
import type { Achievement } from "@/types/database";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function HistoryPage({ searchParams }: Props) {
  noStore();

  const { month } = await searchParams;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // デフォルトは先月（今月を見たい場合はホームを使う）
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defaultMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // URLパラメータが未来の月なら今月に補正
  const rawMonth = month ?? defaultMonth;
  const targetMonth = rawMonth > currentMonth ? currentMonth : rawMonth;

  // 月の表示用
  const [y, m] = targetMonth.split("-");
  const displayMonth = `${y}年${parseInt(m)}月`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 選択した月の自分の目標と達成記録を取得
  const { data: goals } = await supabase
    .from("goals")
    .select("*, achievements(*)")
    .eq("target_month", targetMonth)
    .eq("user_id", user.id)
    .order("created_at");

  // 月全体の集計
  const totalStamps = goals?.reduce(
    (sum, g) => sum + ((g.achievements as Achievement[])?.filter((a) => a.achieved).length ?? 0),
    0
  ) ?? 0;
  const totalDays = parseInt(new Date(parseInt(y), parseInt(m), 0).getDate().toString());
  const totalPossible = (goals?.length ?? 0) * totalDays;
  const overallRate = totalPossible > 0
    ? Math.round((totalStamps / totalPossible) * 100)
    : 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">過去の履歴</h1>
        <p className="text-sm text-gray-500">月を選んで振り返ろう</p>
      </div>

      {/* 月ナビゲーター */}
      <HistoryMonthSelector value={targetMonth} currentMonth={currentMonth} basePath="/history" />

      {/* 月のサマリーカード */}
      {goals && goals.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 mb-5 border border-orange-100">
          <div className="text-center mb-3">
            <div className="text-sm text-gray-500 font-medium">{displayMonth}の結果</div>
            <div className="text-5xl font-bold text-orange-500 mt-1">{overallRate}%</div>
            <div className="text-sm text-gray-400 mt-0.5">総合達成率</div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-gray-700">{goals.length}</div>
              <div className="text-xs text-gray-400">目標</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-yellow-500">⭐ {totalStamps}</div>
              <div className="text-xs text-gray-400">スタンプ</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-gray-700">{totalDays}日</div>
              <div className="text-xs text-gray-400">月の日数</div>
            </div>
          </div>
        </div>
      )}

      {/* 目標ごとの振り返り */}
      {!goals || goals.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">{displayMonth}の目標はありません</p>
          <p className="text-gray-400 text-sm mt-1">
            矢印で他の月を見てみよう
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <HistoryGoalCard
              key={goal.id}
              goal={goal}
              achievements={(goal.achievements as Achievement[]) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
