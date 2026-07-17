// =============================================
// 履歴用の目標カード（読み取り専用）
// サーバーコンポーネントなのでクリックなどのインタラクションはなし
// =============================================
import { CATEGORIES } from "@/lib/categories";
import type { Goal, Achievement } from "@/types/database";

// その月の最大連続達成日数を計算
function calcMaxStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  let max = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const curr = new Date(sorted[i] + "T00:00:00");
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return max;
}

type Props = {
  goal: Goal;
  achievements: Achievement[];
};

export default function HistoryGoalCard({ goal, achievements }: Props) {
  const category = CATEGORIES.find((c) => c.value === goal.category);

  // 達成した日付セット
  const achievedDates = achievements.filter((a) => a.achieved).map((a) => a.date);
  const achievedSet = new Set(achievedDates);

  // 月の情報
  const [year, month] = goal.target_month.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  // 統計
  const achievedCount = achievedDates.length;
  const rate = Math.round((achievedCount / daysInMonth) * 100);
  const maxStreak = calcMaxStreak(achievedDates);

  // 達成率に応じた評価
  const grade =
    rate >= 90 ? { label: "🏆 パーフェクト！", color: "text-yellow-500" } :
    rate >= 70 ? { label: "⭐ よく頑張った！", color: "text-orange-500" } :
    rate >= 40 ? { label: "💪 いい調子！",    color: "text-blue-500" } :
                 { label: "🌱 次月に挑戦！",   color: "text-gray-400" };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {category && (
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${category.color}`}>
                {category.emoji} {category.value}
              </span>
            )}
            <h3 className="font-bold text-gray-800">{goal.title}</h3>
          </div>
          {/* 達成率 */}
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-orange-500">{rate}%</div>
            <div className="text-xs text-gray-400">{achievedCount}/{daysInMonth}日</div>
          </div>
        </div>

        {/* 評価バッジ */}
        <div className={`mt-2 text-sm font-medium ${grade.color}`}>{grade.label}</div>

        {/* 最大連続日数 */}
        {maxStreak > 0 && (
          <div className="text-xs text-gray-400 mt-0.5">
            最大連続達成: {maxStreak}日
          </div>
        )}
      </div>

      {/* 読み取り専用カレンダー */}
      <div className="px-4 pb-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-1">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-0.5 ${
                i === 0 ? "text-red-300" : i === 6 ? "text-blue-300" : "text-gray-300"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = `${goal.target_month}-${String(day).padStart(2, "0")}`;
            const isAchieved = achievedSet.has(dateStr);
            return (
              <div
                key={day}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs ${
                  isAchieved ? "" : "bg-gray-50"
                }`}
              >
                {isAchieved ? (
                  <span className="text-base leading-none">⭐</span>
                ) : (
                  <span className="text-gray-200">{day}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
