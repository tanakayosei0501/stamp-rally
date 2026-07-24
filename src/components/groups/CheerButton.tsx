"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendCheer } from "@/app/(dashboard)/groups/[groupId]/cheer-actions";
import { useScrollLock } from "@/hooks/useScrollLock";

const PRESETS = [
  "今日もファイト！💪",
  "もう少し！🔥",
  "応援してるよ👏",
  "一緒にがんばろう！🌟",
];

type Props = {
  toUserId: string;
  toName: string;
  groupId: string;
};

export default function CheerButton({ toUserId, toName, groupId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useScrollLock(isOpen);

  function close() {
    setIsOpen(false);
    setSelected(null);
    setCustom("");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function handleSend() {
    const message = custom.trim() || selected;
    if (!message) return;
    startTransition(async () => {
      const result = await sendCheer(groupId, toUserId, message);
      if (result.error) {
        showToast(`❌ ${result.error}`);
      } else {
        showToast(`✉️ ${toName}にエールを送りました！`);
        close();
      }
    });
  }

  return (
    <>
      {/* トースト */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* エール送るボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
      >
        ✉️ エール
      </button>

      {/* モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl shadow-xl flex flex-col"
            style={{ maxHeight: "85dvh" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {toName} にエールを送ろう
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">タップして選ぶか、自由に書いてね</p>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
              {/* 定型文 */}
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((msg) => (
                  <button
                    key={msg}
                    onClick={() => { setSelected(msg); setCustom(""); }}
                    className={`py-3 px-3 rounded-xl text-sm font-medium text-left transition-colors ${
                      selected === msg
                        ? "bg-orange-400 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    {msg}
                  </button>
                ))}
              </div>

              {/* 自由入力 */}
              <div>
                <textarea
                  value={custom}
                  onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
                  placeholder="自由にメッセージを書く（任意）"
                  rows={2}
                  maxLength={100}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 resize-none text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex-shrink-0 px-5 pt-3 pb-8 bg-white border-t border-gray-100">
              <button
                onClick={handleSend}
                disabled={isPending || (!selected && !custom.trim())}
                className="w-full bg-orange-400 hover:bg-orange-500 active:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                {isPending ? "送信中…" : "✉️ エールを送る"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
