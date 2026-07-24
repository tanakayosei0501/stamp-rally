"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toggleAchievement } from "@/app/(dashboard)/home/actions";
import { CATEGORIES } from "@/lib/categories";
import type { Goal, Achievement } from "@/types/database";

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// その日時点での連続達成日数を計算（スタンプティア判定に使用）
function calcStreakAt(achieved: Set<string>, dateStr: string): number {
  if (!achieved.has(dateStr)) return 0;
  let count = 0;
  const [y, m, d] = dateStr.split("-").map(Number);
  const cur = new Date(y, m - 1, d);
  while (achieved.has(toDateStr(cur))) {
    count++;
    cur.setDate(cur.getDate() - 1);
  }
  return count;
}

// 今日から遡る連続日数
function calcStreak(achieved: Set<string>, fromDate: string): number {
  return calcStreakAt(achieved, fromDate);
}

type Tier = "gold" | "silver" | "normal";

function getTier(streakAt: number): Tier {
  if (streakAt >= 14) return "gold";
  if (streakAt >= 7)  return "silver";
  return "normal";
}

// ティア別スタイル
const TIER_STYLE: Record<Tier, { cell: string; emoji: string; textSize: string }> = {
  gold:   { cell: "bg-gradient-to-br from-amber-100 to-yellow-200 ring-1 ring-amber-400", emoji: "⭐", textSize: "text-lg" },
  silver: { cell: "bg-gradient-to-br from-slate-100 to-gray-200 ring-1 ring-slate-300",  emoji: "⭐", textSize: "text-base" },
  normal: { cell: "",                                                                       emoji: "⭐", textSize: "text-base" },
};

type Props = {
  goal: Goal;
  achievements: Achievement[];
  todayStr: string;
  groupName?: string;
};

export default function GoalStampCard({ goal, achievements, todayStr, groupName }: Props) {
  const router = useRouter();
  const [achieved, setAchieved] = useState(
    () => new Set(achievements.filter((a) => a.achieved).map((a) => a.date))
  );
  const [celebrating, setCelebrating] = useState(false);
  // 直前に押したセルの日付（インクリップルに使う）
  const [newlyStamped, setNewlyStamped] = useState<string | null>(null);

  useEffect(() => {
    setAchieved(new Set(achievements.filter((a) => a.achieved).map((a) => a.date)));
  }, [achievements]);

  const category = CATEGORIES.find((c) => c.value === goal.category);
  const currentMonth = todayStr.slice(0, 7);
  const isCurrentMonth = goal.target_month === currentMonth;
  const todayAchieved = achieved.has(todayStr);

  const [year, month] = goal.target_month.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const elapsedDays = isCurrentMonth ? parseInt(todayStr.slice(8, 10)) : daysInMonth;
  const achievedCount = achieved.size;
  const rate = elapsedDays > 0 ? Math.round((achievedCount / elapsedDays) * 100) : 0;

  const streakBaseDate = isCurrentMonth
    ? todayStr
    : `${goal.target_month}-${String(daysInMonth).padStart(2, "0")}`;
  const streak = calcStreak(achieved, streakBaseDate);

  async function handleToggle(dateStr: string) {
    if (dateStr > todayStr) return;
    const isAdding = !achieved.has(dateStr);

    setAchieved((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });

    if (isAdding) {
      // インクリップル（スタンプを押した瞬間）
      setNewlyStamped(dateStr);
      setTimeout(() => setNewlyStamped(null), 550);
      // 今日だけ祝福バナー
      if (dateStr === todayStr) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 1800);
      }
    }

    await toggleAchievement(goal.id, dateStr);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* ── ヘッダー ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1 mb-1">
              {category && (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                  {category.emoji} {category.value}
                </span>
              )}
              {groupName && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                  🤝 {groupName}
                </span>
              )}
            </div>
            <h2 className="font-bold text-gray-800 leading-snug">{goal.title}</h2>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-orange-500">{rate}%</div>
            <div className="text-xs text-gray-400">{achievedCount}/{elapsedDays}日</div>
          </div>
        </div>

        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 inline-flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full text-sm text-orange-500 font-medium"
          >
            🔥 {streak}日連続達成中！
            {streak >= 14 && <span className="text-amber-500 ml-1">💛</span>}
            {streak >= 7 && streak < 14 && <span className="text-slate-400 ml-1">🌟</span>}
          </motion.div>
        )}
      </div>

      {/* ── 今日達成ボタン ── */}
      {isCurrentMonth && (
        <div className="px-4 pb-3">
          <AnimatePresence mode="wait">
            {celebrating ? (
              <motion.div
                key="celebrate"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold text-center text-lg"
              >
                🎉 やったー！すごい！
              </motion.div>
            ) : todayAchieved ? (
              <motion.button
                key="done"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={() => handleToggle(todayStr)}
                className="w-full py-3 rounded-xl bg-green-50 border-2 border-green-300 text-green-600 font-bold flex items-center justify-center gap-2"
              >
                <span className="text-xl">⭐</span>今日の達成を記録済み
              </motion.button>
            ) : (
              <motion.button
                key="todo"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToggle(todayStr)}
                className="w-full py-3 rounded-xl bg-orange-400 hover:bg-orange-500 active:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200"
              >
                <span className="text-xl">🎯</span>今日達成した！
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── スタンプカレンダー（スタンプ帳風の台紙） ── */}
      <div className="px-4 pb-4">
        <div className="bg-amber-50 rounded-xl p-2 border border-amber-100/80">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 mb-1">
            {["日","月","火","水","木","金","土"].map((d, i) => (
              <div
                key={d}
                className={`text-center text-xs font-medium py-0.5 ${
                  i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
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
              const isAchieved = achieved.has(dateStr);
              const isToday   = dateStr === todayStr;
              const isFuture  = dateStr > todayStr;

              const streakAt = isAchieved ? calcStreakAt(achieved, dateStr) : 0;
              const tier = getTier(streakAt);
              const { cell: cellCls, emoji, textSize } = TIER_STYLE[tier];

              return (
                <button
                  key={day}
                  onClick={() => handleToggle(dateStr)}
                  disabled={isFuture}
                  className={[
                    "aspect-square flex items-center justify-center rounded-lg text-xs relative",
                    "transition-all active:scale-90",
                    isFuture ? "opacity-20 cursor-not-allowed" : "cursor-pointer",
                    !isAchieved && !isFuture ? "hover:bg-orange-100" : "",
                    isToday && !isAchieved ? "ring-2 ring-orange-400 ring-offset-1" : "",
                    cellCls,
                  ].join(" ")}
                >
                  {/* ── インクにじみリップル ── */}
                  <AnimatePresence>
                    {newlyStamped === dateStr && (
                      <motion.div
                        key="ripple"
                        initial={{ scale: 0.2, opacity: 0.75 }}
                        animate={{ scale: 3.0, opacity: 0 }}
                        exit={{}}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-orange-300 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {/* ── スタンプ本体 ── */}
                  <AnimatePresence>
                    {isAchieved ? (
                      <motion.span
                        key="stamp"
                        initial={{ scale: 1.7, rotate: -14, y: -5, opacity: 0.7 }}
                        animate={{ scale: 1, rotate: tier === "gold" ? 2 : 0, y: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 480, damping: 13 }}
                        className={`${textSize} leading-none select-none relative z-10`}
                      >
                        {emoji}
                      </motion.span>
                    ) : (
                      <span className={`select-none text-xs ${isToday ? "font-bold text-orange-500" : "text-gray-300"}`}>
                        {day}
                      </span>
                    )}
                  </AnimatePresence>

                  {/* 金スタンプのきらめき */}
                  {isAchieved && tier === "gold" && (
                    <motion.span
                      className="absolute top-0 right-0.5 text-[7px] text-amber-400 leading-none"
                      animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      ✦
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ティア説明（連続日数がある場合のみ） */}
          {streak >= 7 && (
            <div className="mt-2 text-center text-[10px] text-gray-400">
              {streak >= 14
                ? "💛 ゴールドスタンプ獲得中（14日以上連続）"
                : "🌟 シルバースタンプ獲得中（7日以上連続）"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
