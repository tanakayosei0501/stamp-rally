"use client";
// =============================================
// 履歴ページ用の月ナビゲーター
// 左右の矢印で前後の月に移動できる
// 今月より未来には進めない
// =============================================
import { useRouter } from "next/navigation";

type Props = {
  value: string;      // 現在表示中の月 "2026-07"
  currentMonth: string; // 今月 (これ以上未来には進めない)
};

// "2026-07" を前後に動かすヘルパー関数
function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// "2026-07" → "2026年7月" に変換
function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

export default function HistoryMonthSelector({ value, currentMonth }: Props) {
  const router = useRouter();

  const prevMonth = shiftMonth(value, -1);
  const nextMonth = shiftMonth(value, +1);
  const canGoNext = nextMonth <= currentMonth; // 今月を超えては進めない

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 mb-5">
      {/* 前の月へ */}
      <button
        onClick={() => router.push(`/history?month=${prevMonth}`)}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors text-lg"
      >
        ‹
      </button>

      {/* 現在の月 */}
      <div className="text-center">
        <div className="font-bold text-gray-800">{formatMonth(value)}</div>
        {value === currentMonth && (
          <div className="text-xs text-orange-500 font-medium">今月</div>
        )}
      </div>

      {/* 次の月へ */}
      <button
        onClick={() => canGoNext && router.push(`/history?month=${nextMonth}`)}
        disabled={!canGoNext}
        className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-colors ${
          canGoNext
            ? "hover:bg-gray-100 text-gray-500"
            : "text-gray-200 cursor-not-allowed"
        }`}
      >
        ›
      </button>
    </div>
  );
}
