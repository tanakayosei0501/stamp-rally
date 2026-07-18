"use client";
import { useRouter } from "next/navigation";

type Props = {
  value: string;
  currentMonth: string;
  basePath?: string; // デフォルト "/history"、グループ詳細なら "/groups/xxx" など
};

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m)}月`;
}

export default function HistoryMonthSelector({
  value,
  currentMonth,
  basePath = "/history",
}: Props) {
  const router = useRouter();
  const prevMonth = shiftMonth(value, -1);
  const nextMonth = shiftMonth(value, +1);
  const canGoNext = nextMonth <= currentMonth;

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 mb-5">
      <button
        onClick={() => router.push(`${basePath}?month=${prevMonth}`)}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors text-lg"
      >
        ‹
      </button>
      <div className="text-center">
        <div className="font-bold text-gray-800">{formatMonth(value)}</div>
        {value === currentMonth && (
          <div className="text-xs text-orange-500 font-medium">今月</div>
        )}
      </div>
      <button
        onClick={() => canGoNext && router.push(`${basePath}?month=${nextMonth}`)}
        disabled={!canGoNext}
        className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-colors ${
          canGoNext ? "hover:bg-gray-100 text-gray-500" : "text-gray-200 cursor-not-allowed"
        }`}
      >
        ›
      </button>
    </div>
  );
}
