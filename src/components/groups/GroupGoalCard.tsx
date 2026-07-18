"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { toggleReaction } from "@/app/(dashboard)/groups/[groupId]/actions";
import type { Goal, Achievement, Reaction } from "@/types/database";

const REACTION_TYPES = [
  { type: "clap",   emoji: "👏", label: "すごい！" },
  { type: "fire",   emoji: "🔥", label: "燃える！" },
  { type: "muscle", emoji: "💪", label: "ナイス！" },
] as const;

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
  reactions: Reaction[];     // このゴールの達成記録に付いたリアクション全件
  currentUserId: string;
  isMe: boolean;
};

export default function GroupGoalCard({
  goal,
  achievements,
  reactions,
  currentUserId,
  isMe,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const category = CATEGORIES.find((c) => c.value === goal.category);

  // achieved な記録を日付でマップ
  const achievementByDate = new Map<string, Achievement>();
  for (const a of achievements) {
    if (a.achieved) achievementByDate.set(a.date, a);
  }
  const achievedDates = [...achievementByDate.keys()];

  // リアクションを achievement_id でグループ化
  const reactionsByAchievement = new Map<string, Reaction[]>();
  for (const r of reactions) {
    const list = reactionsByAchievement.get(r.achievement_id) ?? [];
    list.push(r);
    reactionsByAchievement.set(r.achievement_id, list);
  }

  const [year, month] = goal.target_month.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const achievedCount = achievedDates.length;
  const rate = Math.round((achievedCount / daysInMonth) * 100);
  const maxStreak = calcMaxStreak(achievedDates);

  const grade =
    rate >= 90 ? { label: "🏆 パーフェクト！", color: "text-yellow-500" } :
    rate >= 70 ? { label: "⭐ よく頑張った！", color: "text-orange-500" } :
    rate >= 40 ? { label: "💪 いい調子！",    color: "text-blue-500" } :
                 { label: "🌱 次月に挑戦！",   color: "text-gray-400" };

  // 選択中セルのリアクション情報
  const selectedReactions = selectedAchievement
    ? (reactionsByAchievement.get(selectedAchievement.id) ?? [])
    : [];
  const myReactionOnSelected = selectedReactions.find((r) => r.user_id === currentUserId);

  function handleDayClick(achievement: Achievement) {
    if (isMe) return;
    setSelectedAchievement((prev) => (prev?.id === achievement.id ? null : achievement));
  }

  function handleReact(type: string) {
    if (!selectedAchievement) return;
    const achievementId = selectedAchievement.id;
    startTransition(async () => {
      await toggleReaction(achievementId, type);
      router.refresh();
    });
    setSelectedAchievement(null);
  }

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
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-orange-500">{rate}%</div>
            <div className="text-xs text-gray-400">{achievedCount}/{daysInMonth}日</div>
          </div>
        </div>
        <div className={`mt-2 text-sm font-medium ${grade.color}`}>{grade.label}</div>
        {maxStreak > 0 && (
          <div className="text-xs text-gray-400 mt-0.5">最大連続達成: {maxStreak}日</div>
        )}
        {!isMe && (
          <div className="text-xs text-gray-400 mt-0.5">⭐ をタップしてリアクション</div>
        )}
      </div>

      {/* カレンダー */}
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
            const achievement = achievementByDate.get(dateStr);
            const isAchieved = !!achievement;
            const cellReactions = achievement
              ? (reactionsByAchievement.get(achievement.id) ?? [])
              : [];
            const isSelected = !!selectedAchievement && selectedAchievement.id === achievement?.id;

            return (
              <div
                key={day}
                onClick={() => achievement && !isMe && handleDayClick(achievement)}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs relative ${
                  isAchieved && !isMe ? "cursor-pointer" : ""
                } ${
                  isSelected
                    ? "ring-2 ring-orange-400 bg-orange-50"
                    : isAchieved
                    ? "hover:bg-orange-50"
                    : "bg-gray-50"
                }`}
              >
                {isAchieved ? (
                  <>
                    <span className="text-base leading-none">⭐</span>
                    {cellReactions.length > 0 && (
                      <span className="absolute bottom-0 right-0 bg-orange-400 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold leading-none">
                        {cellReactions.length}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-200">{day}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* リアクションパネル（他人の⭐をタップしたとき表示） */}
        {selectedAchievement && !isMe && (
          <div className="mt-3 bg-orange-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-2 text-center">
              {selectedAchievement.date.replace(/-/g, "/")} の達成にリアクション
              {myReactionOnSelected && (
                <span className="ml-1 text-orange-500">· もう一度押すと解除</span>
              )}
            </div>
            <div className="flex justify-center gap-3">
              {REACTION_TYPES.map(({ type, emoji, label }) => {
                const count = selectedReactions.filter((r) => r.type === type).length;
                const isMine = myReactionOnSelected?.type === type;
                return (
                  <button
                    key={type}
                    disabled={isPending}
                    onClick={() => handleReact(type)}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-95 ${
                      isMine
                        ? "bg-orange-400 text-white shadow-sm scale-105"
                        : "bg-white text-gray-700 hover:bg-orange-100"
                    } ${isPending ? "opacity-50" : ""}`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs font-medium">{label}</span>
                    {count > 0 && (
                      <span className={`text-xs font-bold ${isMine ? "text-white" : "text-orange-500"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
