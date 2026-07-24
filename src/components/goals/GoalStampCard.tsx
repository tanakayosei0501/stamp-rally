"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toggleAchievement } from "@/app/(dashboard)/home/actions";
import { CATEGORIES } from "@/lib/categories";
import { STAMP_EMOJI } from "@/lib/shopItems";
import type { Goal, Achievement } from "@/types/database";

// ─── ユーティリティ ───────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

// ボーナスデー: 毎月 7・14・21・28 日
const BONUS_DAYS = new Set([7, 14, 21, 28]);
function isBonusDay(dateStr: string): boolean {
  return BONUS_DAYS.has(parseInt(dateStr.split("-")[2]));
}

// ─── スタンプティア ───────────────────────────────────────────

type Tier = "gold" | "silver" | "normal";

function getTier(streakAt: number): Tier {
  if (streakAt >= 14) return "gold";
  if (streakAt >= 7)  return "silver";
  return "normal";
}

const TIER_CELL: Record<Tier, string> = {
  gold:   "bg-gradient-to-br from-amber-100 to-yellow-200 ring-1 ring-amber-400",
  silver: "bg-gradient-to-br from-slate-100 to-gray-200 ring-1 ring-slate-300",
  normal: "",
};

// レアスタンプのセルスタイル（ティアより優先）
const RARE_CELL = "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 ring-2 ring-purple-400 ring-offset-1";

// 祝福バナーの種類
type CelebrationType = "normal" | "bonus" | "rare" | "bonus-rare";

const CELEBRATION: Record<CelebrationType, { text: string; cls: string }> = {
  "normal":     { text: "🎉 やったー！すごい！",         cls: "from-yellow-400 to-orange-400" },
  "bonus":      { text: "🎁 ボーナスデー達成！ラッキー！", cls: "from-green-400 to-teal-400" },
  "rare":       { text: "🌈 レアスタンプ！幸運だ！",      cls: "from-pink-500 to-purple-500" },
  "bonus-rare": { text: "🌈🎁 Wラッキー！！最高！！",     cls: "from-purple-500 via-pink-400 to-yellow-400" },
};

// ─── Props ────────────────────────────────────────────────────

type Props = {
  goal: Goal;
  achievements: Achievement[];
  todayStr: string;
  groupName?: string;
  activeStamp?: string;
};

// ─── コンポーネント ────────────────────────────────────────────

export default function GoalStampCard({ goal, achievements, todayStr, groupName, activeStamp = "default" }: Props) {
  const router = useRouter();

  // 達成済み日付の Set
  const [achieved, setAchieved] = useState(
    () => new Set(achievements.filter((a) => a.achieved).map((a) => a.date))
  );
  // レアスタンプが出た日付の Set
  const [rareSet, setRareSet] = useState(
    () => new Set(achievements.filter((a) => a.achieved && a.is_rare).map((a) => a.date))
  );

  const [celebrating, setCelebrating] = useState<CelebrationType | null>(null);
  const [newlyStamped, setNewlyStamped] = useState<string | null>(null);
  const [justGotRare, setJustGotRare]  = useState<string | null>(null);

  useEffect(() => {
    setAchieved(new Set(achievements.filter((a) => a.achieved).map((a) => a.date)));
    setRareSet(new Set(achievements.filter((a) => a.achieved && a.is_rare).map((a) => a.date)));
  }, [achievements]);

  const category       = CATEGORIES.find((c) => c.value === goal.category);
  const currentMonth   = todayStr.slice(0, 7);
  const isCurrentMonth = goal.target_month === currentMonth;
  const todayAchieved  = achieved.has(todayStr);

  const [year, month]  = goal.target_month.split("-").map(Number);
  const daysInMonth    = new Date(year, month, 0).getDate();
  const firstDay       = new Date(year, month - 1, 1).getDay();
  const elapsedDays    = isCurrentMonth ? parseInt(todayStr.slice(8, 10)) : daysInMonth;
  const achievedCount  = achieved.size;
  const rate           = elapsedDays > 0 ? Math.round((achievedCount / elapsedDays) * 100) : 0;

  const streakBaseDate = isCurrentMonth
    ? todayStr
    : `${goal.target_month}-${String(daysInMonth).padStart(2, "0")}`;
  const streak = calcStreakAt(achieved, streakBaseDate);

  async function handleToggle(dateStr: string) {
    if (dateStr > todayStr) return;
    const isAdding = !achieved.has(dateStr);

    // 楽観的更新
    setAchieved((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });

    if (isAdding) {
      // 5% でレアスタンプ抽選（クライアント側）
      const isRare = Math.random() < 0.05;

      if (isRare) {
        setRareSet((prev) => new Set([...prev, dateStr]));
        setJustGotRare(dateStr);
        setTimeout(() => setJustGotRare(null), 1200);
      }

      // インクリップル
      setNewlyStamped(dateStr);
      setTimeout(() => setNewlyStamped(null), 550);

      // 今日だけ祝福バナー
      if (dateStr === todayStr) {
        const bonus = isBonusDay(dateStr);
        const type: CelebrationType =
          bonus && isRare ? "bonus-rare" : isRare ? "rare" : bonus ? "bonus" : "normal";
        setCelebrating(type);
        setTimeout(() => setCelebrating(null), 2200);
      }

      await toggleAchievement(goal.id, dateStr, isRare, true);
    } else {
      // 削除時はレアSet からも除去
      setRareSet((prev) => {
        const next = new Set(prev);
        next.delete(dateStr);
        return next;
      });
      await toggleAchievement(goal.id, dateStr, false, false);
    }

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
                className={`w-full py-3 rounded-xl bg-gradient-to-r ${CELEBRATION[celebrating].cls} text-white font-bold text-center text-base`}
              >
                {CELEBRATION[celebrating].text}
              </motion.div>
            ) : todayAchieved ? (
              <motion.button
                key="done"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={() => handleToggle(todayStr)}
                className="w-full py-3 rounded-xl bg-green-50 border-2 border-green-300 text-green-600 font-bold flex items-center justify-center gap-2"
              >
                <span className="text-xl">{rareSet.has(todayStr) ? "🌈" : (STAMP_EMOJI[activeStamp] ?? "⭐")}</span>
                今日の達成を記録済み
              </motion.button>
            ) : (
              <motion.button
                key="todo"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToggle(todayStr)}
                className="w-full py-3 rounded-xl bg-orange-400 hover:bg-orange-500 active:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200"
              >
                <span className="text-xl">{isBonusDay(todayStr) ? "🎁" : "🎯"}</span>
                {isBonusDay(todayStr) ? "ボーナスデー！今日達成した！" : "今日達成した！"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── スタンプカレンダー（スタンプ帳風） ── */}
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
              const dateStr   = `${goal.target_month}-${String(day).padStart(2, "0")}`;
              const isAchieved = achieved.has(dateStr);
              const isRare    = rareSet.has(dateStr);
              const isToday   = dateStr === todayStr;
              const isFuture  = dateStr > todayStr;
              const isBonus   = isBonusDay(dateStr);

              const streakAt = isAchieved ? calcStreakAt(achieved, dateStr) : 0;
              const tier     = getTier(streakAt);

              // セルの背景（レア > ゴールド > シルバー > 通常）
              const cellCls = isAchieved
                ? isRare
                  ? RARE_CELL
                  : TIER_CELL[tier]
                : "";

              return (
                <button
                  key={day}
                  onClick={() => handleToggle(dateStr)}
                  disabled={isFuture}
                  className={[
                    "aspect-square flex items-center justify-center rounded-lg text-xs relative overflow-visible",
                    "transition-all active:scale-90",
                    isFuture ? "opacity-20 cursor-not-allowed" : "cursor-pointer",
                    !isAchieved && !isFuture ? "hover:bg-orange-100" : "",
                    isToday && !isAchieved ? "ring-2 ring-orange-400 ring-offset-1" : "",
                    cellCls,
                  ].join(" ")}
                >
                  {/* ボーナスデー予告マーカー（未達成） */}
                  {isBonus && !isAchieved && !isFuture && (
                    <span className="absolute top-0 right-0.5 text-[7px] leading-none">🎁</span>
                  )}

                  {/* インクにじみリップル */}
                  <AnimatePresence>
                    {newlyStamped === dateStr && (
                      <motion.div
                        key="ripple"
                        initial={{ scale: 0.2, opacity: 0.75 }}
                        animate={{ scale: 3.0, opacity: 0 }}
                        exit={{}}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{ backgroundColor: isRare ? "#e879f9" : "#fb923c" }}
                      />
                    )}
                  </AnimatePresence>

                  {/* レアスタンプのパーティクルバースト */}
                  <AnimatePresence>
                    {justGotRare === dateStr &&
                      [0, 60, 120, 180, 240, 300].map((deg) => (
                        <motion.span
                          key={`p${deg}`}
                          initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
                          animate={{
                            x: Math.cos((deg * Math.PI) / 180) * 26,
                            y: Math.sin((deg * Math.PI) / 180) * 26,
                            scale: 0,
                            opacity: 0,
                          }}
                          exit={{}}
                          transition={{ duration: 0.75, ease: "easeOut" }}
                          className="absolute text-[9px] pointer-events-none z-20 select-none"
                        >
                          ✨
                        </motion.span>
                      ))}
                  </AnimatePresence>

                  {/* スタンプ本体 */}
                  <AnimatePresence>
                    {isAchieved ? (
                      <motion.span
                        key="stamp"
                        initial={{ scale: 1.7, rotate: isRare ? 15 : -14, y: -5, opacity: 0.7 }}
                        animate={{ scale: 1, rotate: tier === "gold" ? 2 : 0, y: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 480, damping: 13 }}
                        className={`leading-none select-none relative z-10 ${
                          tier === "gold" || isRare ? "text-lg" : "text-base"
                        }`}
                      >
                        {isRare ? "🌈" : (STAMP_EMOJI[activeStamp] ?? "⭐")}
                      </motion.span>
                    ) : (
                      <span className={`select-none text-xs ${isToday ? "font-bold text-orange-500" : "text-gray-300"}`}>
                        {day}
                      </span>
                    )}
                  </AnimatePresence>

                  {/* ゴールドスタンプのきらめき */}
                  {isAchieved && tier === "gold" && !isRare && (
                    <motion.span
                      className="absolute top-0 right-0.5 text-[7px] text-amber-400 leading-none"
                      animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      ✦
                    </motion.span>
                  )}

                  {/* レアスタンプのきらめき */}
                  {isAchieved && isRare && (
                    <motion.span
                      className="absolute top-0 right-0.5 text-[7px] text-purple-400 leading-none"
                      animate={{ opacity: [1, 0.2, 1], scale: [1, 1.5, 1], rotate: [0, 30, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      ✦
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ティア / ボーナスデー説明 */}
          <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 px-0.5">
            <span>
              {[7, 14, 21, 28].map((d) => {
                const ds = `${goal.target_month}-${String(d).padStart(2, "0")}`;
                return ds <= todayStr ? null : (
                  <span key={d}>🎁 {d}日</span>
                );
              }).filter(Boolean).slice(0, 2)}
              {!isCurrentMonth && ""}
            </span>
            {streak >= 7 && (
              <span>
                {streak >= 14 ? "💛 ゴールドスタンプ中" : "🌟 シルバースタンプ中"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
