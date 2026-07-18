// グループ詳細ページ：1メンバー分の目標とスタンプを表示するセクション
// サーバーコンポーネント（読み取り専用）
import HistoryGoalCard from "@/components/history/HistoryGoalCard";
import type { Goal, Achievement } from "@/types/database";

type GoalWithAchievements = Goal & { achievements: Achievement[] };

type Props = {
  userId: string;
  displayName: string;
  isMe: boolean;
  goals: GoalWithAchievements[];
  totalStamps: number;
  achievedToday: boolean;
};

export default function MemberGoalsSection({
  displayName,
  isMe,
  goals,
  totalStamps,
  achievedToday,
}: Props) {
  const totalDays = goals.length > 0
    ? (() => {
        const [y, m] = goals[0].target_month.split("-").map(Number);
        return new Date(y, m, 0).getDate();
      })()
    : 0;

  const totalPossible = goals.length * totalDays;
  const rate = totalPossible > 0 ? Math.round((totalStamps / totalPossible) * 100) : 0;

  return (
    <div className="mb-8">
      {/* メンバーヘッダー */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-lg shrink-0 ${
            isMe ? "bg-orange-400" : "bg-gray-300"
          }`}
        >
          {displayName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800">
            {displayName}
            {isMe && <span className="ml-1 text-xs text-orange-400 font-normal">（自分）</span>}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>⭐ {totalStamps}スタンプ</span>
            {totalPossible > 0 && <span>/ 達成率 {rate}%</span>}
            {achievedToday && (
              <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium">
                今日達成✅
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 目標カード一覧 */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center text-gray-400 text-sm ml-0">
          この月の目標はありません
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <HistoryGoalCard
              key={goal.id}
              goal={goal}
              achievements={goal.achievements}
            />
          ))}
        </div>
      )}
    </div>
  );
}
