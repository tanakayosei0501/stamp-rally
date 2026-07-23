"use client";
import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGoal, updateGoal } from "@/app/(dashboard)/goals/actions";
import { CATEGORIES } from "@/lib/categories";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { Goal } from "@/types/database";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
  defaultMonth: string;
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

  // iOS Safari: body をロックしてモーダル背後のスクロールを防ぐ
  useScrollLock(isOpen);

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
    router.refresh();
  }

  return (
    /*
     * 背景オーバーレイ: fixed inset-0 で画面全体を覆う
     * overflow-hidden で内部コンテンツのはみ出しを防ぐ
     */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/*
       * モーダルパネル
       * - 高さ: 画面の最大85%に制限 (safe-area を考慮して少し余裕を持たせる)
       * - flex flex-col: ヘッダー固定・中身スクロール・フッター固定のレイアウト
       */}
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl shadow-xl flex flex-col sm:rounded-2xl sm:mb-8"
        style={{ maxHeight: "85dvh" }}
      >
        {/* ヘッダー（スクロールしない） */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? "目標を編集" : "新しい目標を追加"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* フォーム: 中身はスクロール、ボタンは固定 */}
        <form ref={formRef} action={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* スクロール可能なフィールド領域 */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4">
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

            {/* メモ（任意） */}
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
          </div>

          {/* 送信ボタン（スクロールしない・常に画面内） */}
          <div className="flex-shrink-0 px-6 pt-3 pb-8 bg-white border-t border-gray-100">
            <button
              type="submit"
              className="w-full bg-orange-400 hover:bg-orange-500 active:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              {isEditing ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
