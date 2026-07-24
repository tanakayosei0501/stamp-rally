"use client";
import { motion } from "framer-motion";

export type BadgeInfo = {
  icon: string;
  label: string;
  holder: string;
  color: string;
};

export type MvpInfo = {
  name: string;
  stamps: number;
  isMe: boolean;
};

type Props = {
  mvp: MvpInfo | null;
  badges: BadgeInfo[];
};

export default function GroupBadges({ mvp, badges }: Props) {
  if (!mvp && badges.length === 0) return null;

  return (
    <div className="mb-5">
      {/* MVP バナー */}
      {mvp && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-50 to-amber-100 rounded-2xl p-4 mb-3 flex items-center gap-3 border border-amber-200"
        >
          <motion.span
            className="text-3xl select-none"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            👑
          </motion.span>
          <div>
            <div className="text-xs font-bold text-amber-600 mb-0.5">今月のMVP</div>
            <div className="font-bold text-amber-900 text-base">
              {mvp.name}
              {mvp.isMe && <span className="text-xs text-amber-600 font-normal ml-1">（あなた）</span>}
            </div>
            <div className="text-xs text-amber-700">⭐ {mvp.stamps} スタンプ獲得</div>
          </div>
        </motion.div>
      )}

      {/* バッジ一覧 */}
      {badges.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {badges.map((badge, i) => (
            <motion.div
              key={`${badge.icon}-${i}`}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 350, damping: 22 }}
              className={`${badge.color} rounded-xl p-3 flex items-center gap-2.5`}
            >
              <span className="text-2xl select-none flex-shrink-0">{badge.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">{badge.label}</div>
                <div className="text-xs opacity-80 truncate mt-0.5">{badge.holder}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
