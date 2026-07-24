"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollLock } from "@/hooks/useScrollLock";

type Props = {
  displayMonth: string;
  achievementRate: number;
  totalStamps: number;
  characterEmoji: string;
  goalsCount: number;
};

export default function ShareCard({
  displayMonth,
  achievementRate,
  totalStamps,
  characterEmoji,
  goalsCount,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);

  // Canvas を使って OGP 風の PNG を生成してダウンロード
  async function handleDownload() {
    setIsGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      const W = 800, H = 800;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // 背景グラデーション
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#fff7ed");
      grad.addColorStop(1, "#fef3c7");
      ctx.fillStyle = grad;
      ctx.roundRect(0, 0, W, H, 40);
      ctx.fill();

      // タイトル帯
      ctx.fillStyle = "#f97316";
      ctx.fillRect(0, 0, W, 90);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📅 月次目標スタンプラリー", W / 2, 56);

      // 月
      ctx.fillStyle = "#92400e";
      ctx.font = "bold 32px system-ui, sans-serif";
      ctx.fillText(displayMonth, W / 2, 140);

      // キャラクター絵文字（大）
      ctx.font = "140px sans-serif";
      ctx.fillText(characterEmoji, W / 2, 310);

      // 達成率
      ctx.fillStyle = "#f97316";
      ctx.font = "bold 120px system-ui, sans-serif";
      ctx.fillText(`${achievementRate}%`, W / 2, 470);

      ctx.fillStyle = "#9a3412";
      ctx.font = "bold 26px system-ui, sans-serif";
      ctx.fillText("月間達成率", W / 2, 510);

      // 区切り線
      ctx.strokeStyle = "#fed7aa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 545);
      ctx.lineTo(W - 80, 545);
      ctx.stroke();

      // スタンプ数・目標数
      ctx.fillStyle = "#92400e";
      ctx.font = "bold 36px system-ui, sans-serif";
      ctx.fillText(`⭐ ${totalStamps} スタンプ獲得`, W / 2, 600);

      ctx.fillStyle = "#b45309";
      ctx.font = "26px system-ui, sans-serif";
      ctx.fillText(`今月の目標: ${goalsCount}個`, W / 2, 645);

      // フッター
      ctx.fillStyle = "#d97706";
      ctx.font = "22px system-ui, sans-serif";
      ctx.fillText("stamp-rally-vert.vercel.app", W / 2, 760);

      // ダウンロード
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stamp-rally-${displayMonth}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      {/* ホーム画面のシェアボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors mt-3"
      >
        📸 今月をシェア
      </button>

      {/* プレビューモーダル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="w-full max-w-sm"
            >
              {/* シェアカードプレビュー */}
              <div
                ref={cardRef}
                className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-3xl overflow-hidden shadow-2xl"
              >
                {/* ヘッダー */}
                <div className="bg-orange-400 text-white text-center py-4">
                  <div className="text-sm font-bold">📅 月次目標スタンプラリー</div>
                </div>

                <div className="p-6 text-center">
                  <div className="text-lg font-bold text-amber-800 mb-4">{displayMonth}</div>

                  {/* キャラクター */}
                  <div className="text-7xl mb-4 select-none">{characterEmoji}</div>

                  {/* 達成率 */}
                  <div className="text-6xl font-bold text-orange-500 mb-1">{achievementRate}%</div>
                  <div className="text-sm text-amber-700 font-medium mb-5">月間達成率</div>

                  <div className="border-t border-orange-200 pt-4 space-y-1">
                    <div className="font-bold text-amber-800">⭐ {totalStamps} スタンプ獲得</div>
                    <div className="text-sm text-amber-600">目標 {goalsCount}個に挑戦中</div>
                  </div>

                  <div className="mt-5 text-xs text-orange-300">stamp-rally-vert.vercel.app</div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  {isGenerating ? "生成中…" : "📥 PNG で保存"}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-white text-gray-600 font-medium py-3 rounded-xl border border-gray-200"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
