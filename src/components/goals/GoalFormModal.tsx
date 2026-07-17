"use client";
// =============================================
// 目標の追加/編集フォームモーダル
// =============================================
import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGoal, updateGoal } from "@/app/(dashboard)/goals/actions";
import { CATEGORIES } from "@/lib/categories";
import type { Goal } from "@/types/database";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null; // 編集時は既存の目標データを渡す
  defaultMonth: string;      // 新規作成時のデフォルト月
};

export default function GoalFormModal({
  isOpen,
  onClose,
  editingGoal,
  defaultMonth,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const isEditing = !!editingGoal;

  // モーダルが開いたらフォームをリセット
  useEffect(() => {
    if (isOpen && !isEditing) {
      formRef.current?.reset();
    }
  }, [isOpen, isEditing]);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    if (isEditing) {
      await updateGoal(formData);
    } else {
      await createGoal(formData);
    }
    onClose();
    // クライアントコンポーネントからサーバーアクションを呼んだ場合、
    // revalidatePath だけでは画面が更新されないので router.refresh() が必要
    router.refresh();
  }

  return (
    // 背景クリックで閉じる
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? "目標を編集" : "新しい目標を追加"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          {/* 編集時はIDを hidden で持つ */}
          {isEditing && (
            <input type="hidden" name="id" value={editingGoal.id} />
          )}

          {/* 対象月 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              対象月
            </label>
            <input
              type="month"
              name="target_month"
              defaultValue={editingGoal?.target_month ?? defaultMonth}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800"
            />
          </div>

          {/* 目標タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目標タイトル <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              defaultValue={editingGoal?.title}
              required
              placeholder="例: 毎日30分ウォーキングする"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <label key={cat.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    defaultChecked={editingGoal?.category === cat.value}
                    className="sr-only peer"
                  />
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 border-transparent peer-checked:border-orange-400 ${cat.color} transition-all`}>
                    {cat.emoji} {cat.value}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* メモ(任意) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ（任意）
            </label>
            <textarea
              name="description"
              defaultValue={editingGoal?.description ?? ""}
              placeholder="目標の詳細や動機など..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {isEditing ? "更新する" : "追加する"}
          </button>
        </form>
      </div>
    </div>
  );
}
