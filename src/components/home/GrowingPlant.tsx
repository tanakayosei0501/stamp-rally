"use client";
import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

type Props = {
  achievementRate: number;  // 0–100
  daysSinceLastAchievement: number; // -1=未達成, 0=今日, 1=昨日…
  todayAchieved: boolean;
  totalStamps: number;
};

// 達成率に応じた成長ステージ
const STAGES = [
  { minRate: 100, emoji: "🌻", msg: "完璧！今月もやり切った！🎉", bg: "from-yellow-50 to-amber-100", color: "text-yellow-700" },
  { minRate: 81,  emoji: "🌻", msg: "満開まであと少し！",          bg: "from-yellow-50 to-orange-50",  color: "text-amber-600" },
  { minRate: 61,  emoji: "🌺", msg: "元気よく咲いてる！",          bg: "from-orange-50 to-amber-50",   color: "text-orange-600" },
  { minRate: 41,  emoji: "🌸", msg: "もうすぐ花が咲く！",          bg: "from-pink-50 to-rose-50",      color: "text-pink-600"   },
  { minRate: 21,  emoji: "🌿", msg: "すくすく育ってる！",          bg: "from-green-50 to-teal-50",     color: "text-teal-600"   },
  { minRate: 1,   emoji: "🌱", msg: "芽が出た！いいスタート🌱",    bg: "from-green-50 to-emerald-50",  color: "text-green-600"  },
  { minRate: 0,   emoji: "🪴", msg: "種を蒔いて始めよう！",        bg: "from-stone-50 to-amber-50",    color: "text-stone-600"  },
];

export default function GrowingPlant({ achievementRate, daysSinceLastAchievement, todayAchieved, totalStamps }: Props) {
  const controls = useAnimation();
  const prevAchieved = useRef(todayAchieved);

  const stage = STAGES.find((s) => achievementRate >= s.minRate) ?? STAGES[STAGES.length - 1];

  // 3日以上スタンプなし → しおれ状態（100%達成済みは除外）
  const isDroopy = daysSinceLastAchievement >= 3 && daysSinceLastAchievement !== -1 && achievementRate < 100;
  // まだ一度も達成していない
  const neverAchieved = daysSinceLastAchievement === -1;

  // 今日のスタンプ直後にバウンスアニメーション
  useEffect(() => {
    if (todayAchieved && !prevAchieved.current) {
      controls.start({
        y: [0, -18, 0, -9, 0, -4, 0],
        rotate: [0, -6, 6, -3, 3, 0],
        transition: { duration: 0.75, ease: "easeOut" },
      });
    }
    prevAchieved.current = todayAchieved;
  }, [todayAchieved, controls]);

  return (
    <div className={`bg-gradient-to-br ${stage.bg} rounded-2xl p-4 mb-5 flex items-center gap-4`}>
      {/* キャラクター */}
      <motion.div
        animate={controls}
        className="select-none flex-shrink-0"
        style={{
          fontSize: "3.2rem",
          lineHeight: 1,
          transform: isDroopy ? "rotate(-12deg) translateX(-3px)" : "none",
          transition: "transform 0.6s ease",
        }}
      >
        {stage.emoji}
      </motion.div>

      {/* テキスト＋プログレスバー */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold ${stage.color} leading-snug`}>{stage.msg}</div>

        {isDroopy && (
          <div className="text-xs text-gray-400 mt-0.5">
            {daysSinceLastAchievement}日お休み中… ちょっとしおれてるよ💧
          </div>
        )}
        {neverAchieved && (
          <div className="text-xs text-gray-400 mt-0.5">
            最初の一歩を踏み出そう！
          </div>
        )}
        {todayAchieved && !isDroopy && (
          <div className="text-xs text-green-600 font-medium mt-0.5">
            今日も達成！継続中🔥
          </div>
        )}
        {!todayAchieved && !isDroopy && !neverAchieved && (
          <div className="text-xs text-gray-400 mt-0.5">今日もがんばろう！</div>
        )}

        {/* 達成率バー */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${achievementRate}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-orange-400 rounded-full"
            />
          </div>
          <div className="text-xs text-gray-400 shrink-0 font-medium">
            {totalStamps}⭐ {achievementRate}%
          </div>
        </div>
      </div>
    </div>
  );
}
