import { CATEGORIES } from "@/lib/categories";
import type { Goal, Achievement } from "@/types/database";

type GoalWithAchievements = Goal & { achievements: Achievement[] };

type MemberChallenge = {
  userId: string;
  displayName: string;
  isMe: boolean;
  goal: GoalWithAchievements;
};

type Props = {
  challengeTitle: string;
  challengeCategory: string | null;
  targetMonth: string;
  members: MemberChallenge[];
  todayStr: string;
};

export default function GroupChallengeCard({
  challengeTitle,
  challengeCategory,
  targetMonth,
  members,
  todayStr,
}: Props) {
  const category = CATEGORIES.find((c) => c.value === challengeCategory);
  const [year, month] = targetMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const elapsedDays = targetMonth === todayStr.slice(0, 7)
    ? parseInt(todayStr.slice(8))
    : daysInMonth;

  // 今日達成済みメンバー数
  const doneToday = members.filter((m) =>
    m.goal.achievements.some((a) => a.date === todayStr && a.achieved)
  ).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2 flex-wrap">
          {category && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
              {category.emoji} {category.value}
            </span>
          )}
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
            🤝 グループチャレンジ
          </span>
        </div>
        <h3 className="font-bold text-gray-800 mt-1">{challengeTitle}</h3>
        <div className="text-xs text-gray-400 mt-0.5">
          {`${year}年${month}月 · 今日達成: ${doneToday}/${members.length}人`}
        </div>
      </div>

      {/* メンバーごとの進捗 */}
      <div className="px-4 py-3 space-y-3">
        {members.map((m) => {
          const stamps = m.goal.achievements.filter((a) => a.achieved).length;
          const rate = elapsedDays > 0 ? Math.round((stamps / elapsedDays) * 100) : 0;
          const doneToday = m.goal.achievements.some((a) => a.date === todayStr && a.achieved);

          return (
            <div key={m.userId} className="flex items-center gap-3">
              {/* アバター */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                  m.isMe ? "bg-orange-400" : "bg-gray-300"
                }`}
              >
                {m.displayName.charAt(0)}
              </div>

              {/* 名前 + 進捗バー */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {m.displayName}
                    {m.isMe && <span className="ml-1 text-xs text-orange-400 font-normal">（自分）</span>}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {doneToday && (
                      <span className="text-xs text-green-500 font-medium">✅</span>
                    )}
                    <span className="text-xs font-bold text-gray-600">
                      ⭐{stamps}
                    </span>
                    <span className="text-xs text-gray-400">{rate}%</span>
                  </div>
                </div>
                {/* 進捗バー */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
