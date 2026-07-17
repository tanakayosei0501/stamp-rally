"use client";
// =============================================
// 目標一覧 + 追加ボタン
// モーダルの開閉状態を管理します
// =============================================
import { useState } from "react";
import type { Goal } from "@/types/database";
import GoalCard from "./GoalCard";
import GoalFormModal from "./GoalFormModal";

type Props = {
  goals: Goal[];
  defaultMonth: string;
};

export default function GoalList({ goals, defaultMonth }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  function openAdd() {
    setEditingGoal(null);
    setIsModalOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingGoal(null);
  }

  return (
    <>
      {goals.length === 0 ? (
        // 目標が1つもないときの空状態
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🌱</div>
          <p className="text-gray-500 font-medium">この月の目標がまだありません</p>
          <p className="text-gray-400 text-sm mt-1">下のボタンから追加しましょう！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* 目標を追加するボタン */}
      <button
        onClick={openAdd}
        className="fixed bottom-20 right-4 w-14 h-14 bg-orange-400 hover:bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
        title="目標を追加"
      >
        +
      </button>

      {/* 追加/編集モーダル */}
      <GoalFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingGoal={editingGoal}
        defaultMonth={defaultMonth}
      />
    </>
  );
}
