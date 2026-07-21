"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { createGroupChallenge } from "@/app/(dashboard)/groups/actions";

type Props = {
  groupId: string;
  currentMonth: string; // "2026-07"
};

export default function GroupChallengeModal({ groupId, currentMonth }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [targetMonth, setTargetMonth] = useState(currentMonth);

  function handleClose() {
    setIsOpen(false);
    setError("");
    setTitle("");
    setCategory(CATEGORIES[0].value);
    setTargetMonth(currentMonth);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("チャレンジ名を入力してください"); return; }
    setError("");
    startTransition(async () => {
      const result = await createGroupChallenge(groupId, title, category, targetMonth);
      if (result.error) { setError(result.error); return; }
      handleClose();
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors"
      >
        + チャレンジ追加
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-lg px-5 pt-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">🤝 グループチャレンジを作成</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">グループ全員に同じ目標が追加されます</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* チャレンジ名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">チャレンジ名</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 毎日30分読書"
                  maxLength={50}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {/* カテゴリ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 transition-all ${
                        category === c.value
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span className="text-xl">{c.emoji}</span>
                      <span className="text-[10px] text-gray-600">{c.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 対象月 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">対象月</label>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? "作成中…" : "全員にチャレンジを追加する"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
