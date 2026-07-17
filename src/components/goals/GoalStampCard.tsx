"use client";
// =============================================
// ホーム画面の目標カード
// スタンプカレンダー・今日達成ボタン・統計を含む
// =============================================
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toggleAchievement } from "@/app/(dashboard)/home/actions";
import { CATEGORIES } from "@/lib/categories";
import type { Goal, Achievement } from "@/types/database";

// 今日から遡って連続達成日数を数える
function calcStreak(achieved: Set<string>, fromDate: string): number {
  let streak = 0;
  // タイムゾーンずれを防ぐため文字列操作で日付を扱う
  const [y, m, d] = fromDate.split("-").map(Number);
  const cur = new Date(y, m - 1, d);
  while (true) {
    const s = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    if (!achieved.has(s)) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

type Props = {
  goal: Goal;
  achievements: Achievement[];
  todayStr: string; // "2026-07-17"
};

export default function GoalStampCard({ goal, achievements, todayStr }: Props) {
  const router = useRouter();

  // 達成済み日付のセット（楽観的更新のためローカルで管理）
  const [achieved, setAchieved] = useState(
    () => new Set(achievements.filter((a) => a.achieved).map((a) => a.date))
  );
  // 今日達成ボタンを押した直後の祝福状態
  const [celebrating, setCelebrating] = useState(false);

  // サーバーから新しいデータが来たらローカル状態を同期
  useEffect(() => {
    setAchieved(new Set(achievements.filter((a) => a.achieved).map((a) => a.date)));
  }, [achievements]);

  const category = CATEGORIES.find((c) => c.value === goal.category);
  const currentMonth = todayStr.slice(0, 7);
  const isCurrentMonth = goal.target_month === currentMonth;
  const todayAchieved = achieved.has(todayStr);

  // 月の情報
  const [year, month] = goal.target_month.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=日曜

  // 今月なら今日まで、過去月なら月末までを「経過日数」とする
  const elapsedDays = isCurrentMonth
    ? parseInt(todayStr.slice(8, 10))
    : daysInMonth;
  const achievedCount = achieved.size;
  const rate = elapsedDays > 0 ? Math.round((achievedCount / elapsedDays) * 100) : 0;

  // 連続達成日数（今月なら今日から、過去月なら月末から遡る）
  const streakBaseDate = isCurrentMonth
    ? todayStr
    : `${goal.target_month}-${String(daysInMonth).padStart(2, "0")}`;
  const streak = calcStreak(achieved, streakBaseDate);

  // スタンプのトグル処理
  async function handleToggle(dateStr: string) {
    if (dateStr > todayStr) return; // 未来の日付はスタンプ不可

    const isAdding = !achieved.has(dateStr);

    // 楽観的更新: サーバー応答を待たずに即座にUIに反映
    setAchieved((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });

    // 今日のスタンプを新たに押したとき → 祝福アニメーション
    if (isAdding && dateStr === todayStr) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 1800);
    }

    await toggleAchievement(goal.id, dateStr);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* ── ヘッダー: タイトル・カテゴリ・達成率 ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {category && (
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${category.color}`}>
                {category.emoji} {category.value}
              </span>
            )}
            <h2 className="font-bold text-gray-800 leading-snug">{goal.title}</h2>
          </div>

          {/* 達成率 */}
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-orange-500">{rate}%</div>
            <div className="text-xs text-gray-400">{achievedCount}/{elapsedDays}日</div>
          </div>
        </div>

        {/* 連続記録バッジ */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 inline-flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full text-sm text-orange-500 font-medium"
          >
            🔥 {streak}日連続達成中！
          </motion.div>
        )}
      </div>

      {/* ── 今日達成ボタン（今月の目標のみ表示） ── */}
      {isCurrentMonth && (
        <div className="px-4 pb-3">
          <AnimatePresence mode="wait">
            {celebrating ? (
              // 祝福メッセージ
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
              // 達成済み状態
              <motion.button
                key="done"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={() => handleToggle(todayStr)}
                className="w-full py-3 rounded-xl bg-green-50 border-2 border-green-300 text-green-600 font-bold flex items-center justify-center gap-2"
              >
                <span className="text-xl">⭐</span>
                今日の達成を記録済み
              </motion.button>
            ) : (
              // 未達成状態
              <motion.button
                key="todo"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToggle(todayStr)}
                className="w-full py-3 rounded-xl bg-orange-400 hover:bg-orange-500 active:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200"
              >
                <span className="text-xl">🎯</span>
                今日達成した！
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── スタンプカレンダー ── */}
      <div className="px-4 pb-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-1">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
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
          {/* 月初の空白セル */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {/* 各日のセル */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = `${goal.target_month}-${String(day).padStart(2, "0")}`;
            const isAchieved = achieved.has(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;

            return (
              <button
                key={day}
                onClick={() => handleToggle(dateStr)}
                disabled={isFuture}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-xs
                  transition-all active:scale-90
                  ${isFuture ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
                  ${!isAchieved && !isFuture ? "hover:bg-orange-50" : ""}
                  ${isToday && !isAchieved ? "ring-2 ring-orange-400 ring-offset-1" : ""}
                `}
              >
                <AnimatePresence>
                  {isAchieved ? (
                    // スタンプ（ポップアニメーションで出現）
                    <motion.span
                      key="stamp"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      className="text-base leading-none select-none"
                    >
                      ⭐
                    </motion.span>
                  ) : (
                    // 日付数字
                    <span
                      className={`select-none ${
                        isToday
                          ? "font-bold text-orange-500"
                          : "text-gray-300"
                      }`}
                    >
                      {day}
                    </span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
