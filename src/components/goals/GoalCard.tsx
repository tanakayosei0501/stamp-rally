"use client";
// =============================================
// 目標カード
// 1つの目標を表示するカードコンポーネント
// =============================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGoal } from "@/app/(dashboard)/goals/actions";
import type { Goal } from "@/types/database";
import { CATEGORIES } from "@/lib/categories";

type Props = {
  goal: Goal;
  onEdit: (goal: Goal) => void;
};

export default function GoalCard({ goal, onEdit }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // カテゴリに対応する色とemoji
  const category = CATEGORIES.find((c) => c.value === goal.category);

  async function handleDelete() {
    if (!confirm(`「${goal.title}」を削除しますか？\n達成記録も全て削除されます。`)) return;
    setIsDeleting(true);
    await deleteGoal(goal.id);
    router.refresh();
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-4 transition-opacity ${isDeleting ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* カテゴリバッジ */}
          {category && (
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${category.color}`}>
              {category.emoji} {category.value}
            </span>
          )}

          {/* タイトル */}
          <h3 className="font-semibold text-gray-800 leading-snug">{goal.title}</h3>

          {/* メモ */}
          {goal.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{goal.description}</p>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
            title="編集"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="削除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
