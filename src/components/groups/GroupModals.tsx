"use client";
// =============================================
// グループ作成・参加 モーダル
// =============================================
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroup, joinGroup } from "@/app/(dashboard)/groups/actions";

type ModalType = "create" | "join" | null;

type Props = {
  hasGroups: boolean;
};

export default function GroupModals({ hasGroups }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalType>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function closeModal() {
    setModal(null);
    setError("");
  }

  // グループ作成
  async function handleCreate(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createGroup(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        closeModal();
        router.refresh();
      }
    });
  }

  // 招待コードで参加
  async function handleJoin(formData: FormData) {
    setError("");
    const code = formData.get("invite_code") as string;
    startTransition(async () => {
      const result = await joinGroup(code);
      if (result?.error) {
        setError(result.error);
      } else {
        closeModal();
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* アクションボタン */}
      <div className={`grid gap-3 mb-6 ${hasGroups ? "grid-cols-2" : "grid-cols-1"}`}>
        <button
          onClick={() => setModal("create")}
          className="flex items-center justify-center gap-2 bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-100"
        >
          <span className="text-lg">➕</span> グループを作成
        </button>
        <button
          onClick={() => setModal("join")}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl border border-gray-200 transition-colors"
        >
          <span className="text-lg">🔑</span> コードで参加
        </button>
      </div>

      {/* モーダル */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                {modal === "create" ? "グループを作成" : "招待コードで参加"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            {modal === "create" ? (
              <form action={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    グループ名
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="例: 田中家チーム、友人グループ"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400"
                  />
                </div>
                <p className="text-sm text-gray-400">
                  作成後に表示される招待コードを仲間に共有してください。
                </p>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {isPending ? "作成中..." : "作成する"}
                </button>
              </form>
            ) : (
              <form action={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    招待コード
                  </label>
                  <input
                    type="text"
                    name="invite_code"
                    required
                    placeholder="8桁のコードを入力"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400 tracking-widest font-mono text-center text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {isPending ? "参加中..." : "参加する"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
