"use client";
import { motion } from "framer-motion";

export type ActivityItem = {
  id: string;
  type: "achievement" | "reaction" | "comment";
  actorName: string;
  content: string;
  timestamp: string;
};

type Props = {
  items: ActivityItem[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

const TYPE_ICON: Record<ActivityItem["type"], string> = {
  achievement: "⭐",
  reaction: "👀",
  comment: "💬",
};

const TYPE_BG: Record<ActivityItem["type"], string> = {
  achievement: "bg-yellow-100 text-yellow-700",
  reaction: "bg-orange-100 text-orange-600",
  comment: "bg-blue-100 text-blue-600",
};

export default function GroupActivityFeed({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="font-bold text-gray-700 mb-3 px-1">📡 最近の動き</h3>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`flex items-start gap-3 px-4 py-3 ${i < items.length - 1 ? "border-b border-gray-50" : ""}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${TYPE_BG[item.type]}`}>
              {TYPE_ICON[item.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 leading-snug">
                <span className="font-medium">{item.actorName}</span>
                {" "}{item.content}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{timeAgo(item.timestamp)}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
