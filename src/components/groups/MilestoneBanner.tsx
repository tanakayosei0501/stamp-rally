"use client";
import { motion } from "framer-motion";

type Milestone = {
  name: string;
  streak: number;
};

type Props = {
  milestones: Milestone[];
};

export default function MilestoneBanner({ milestones }: Props) {
  if (milestones.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="mb-5 space-y-2"
    >
      {milestones.map((m) => {
        const isGold = m.streak >= 30;
        const isSilver = m.streak >= 14 && !isGold;
        const icon = isGold ? "🏆" : isSilver ? "🥈" : "🎉";
        const bg = isGold
          ? "bg-gradient-to-r from-amber-100 to-yellow-200 border-amber-300"
          : isSilver
          ? "bg-gradient-to-r from-slate-100 to-gray-200 border-slate-300"
          : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
        const text = isGold ? "text-amber-700" : isSilver ? "text-slate-700" : "text-orange-700";

        return (
          <div key={m.name} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${bg}`}>
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {icon}
            </motion.span>
            <span className={`text-sm font-bold ${text}`}>
              {m.name} が {m.streak}日連続達成中！すごい！
            </span>
            {isGold && (
              <motion.span
                className="text-amber-400 text-lg ml-auto"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ✦
              </motion.span>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
