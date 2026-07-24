"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { purchaseItem, activateItem } from "@/app/(dashboard)/shop/actions";
import { STAMP_ITEMS, CHARACTER_ITEMS } from "@/lib/shopItems";
import type { ShopItem } from "@/lib/shopItems";

type Props = {
  balance: number;
  ownedStamps: string[];
  ownedCharacters: string[];
  activeStamp: string;
  activeCharacter: string;
};

type ItemType = "stamp" | "character";

function ItemCard({
  item,
  type,
  owned,
  active,
  balance,
  onPurchase,
  onActivate,
}: {
  item: ShopItem;
  type: ItemType;
  owned: boolean;
  active: boolean;
  balance: number;
  onPurchase: () => void;
  onActivate: () => void;
}) {
  const isFree = item.cost === 0;
  const canAfford = balance >= item.cost;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-colors ${
        active ? "border-orange-400" : "border-transparent"
      }`}
    >
      <div className="text-center mb-2">
        <div className="text-4xl mb-1 select-none">{item.emoji}</div>
        <div className="text-xs font-bold text-gray-800">{item.name}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{item.description}</div>
      </div>

      {/* コスト */}
      {!isFree && (
        <div className="text-center text-xs font-medium text-orange-500 mb-2">
          ⭐ {item.cost}pt
        </div>
      )}

      {/* ボタン */}
      {active ? (
        <div className="w-full text-center text-xs font-bold text-orange-500 bg-orange-50 py-1.5 rounded-xl">
          ✓ 使用中
        </div>
      ) : owned || isFree ? (
        <button
          onClick={onActivate}
          className="w-full text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 py-1.5 rounded-xl transition-colors"
        >
          これを使う
        </button>
      ) : canAfford ? (
        <button
          onClick={onPurchase}
          className="w-full text-xs font-bold text-white bg-orange-400 hover:bg-orange-500 py-1.5 rounded-xl transition-colors"
        >
          購入する
        </button>
      ) : (
        <div className="w-full text-center text-xs text-gray-300 bg-gray-50 py-1.5 rounded-xl">
          pt 不足
        </div>
      )}
    </motion.div>
  );
}

export default function ShopClient({
  balance,
  ownedStamps,
  ownedCharacters,
  activeStamp,
  activeCharacter,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handlePurchase(type: ItemType, id: string) {
    startTransition(async () => {
      const result = await purchaseItem(type, id);
      if (result.error) {
        showToast(`❌ ${result.error}`);
      } else {
        showToast("🎉 購入しました！");
        router.refresh();
      }
    });
  }

  function handleActivate(type: ItemType, id: string) {
    startTransition(async () => {
      await activateItem(type, id);
      router.refresh();
    });
  }

  return (
    <div className={isPending ? "opacity-70 pointer-events-none" : ""}>
      {/* トースト */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg"
        >
          {toast}
        </motion.div>
      )}

      {/* ポイント残高 */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-5 mb-6 text-center border border-orange-100">
        <div className="text-xs text-orange-400 font-medium mb-1">現在の残高</div>
        <div className="text-4xl font-bold text-orange-500">
          {balance}
          <span className="text-xl ml-1">pt</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">スタンプを押すたびに 1pt 貯まります</div>
      </div>

      {/* スタンプデザイン */}
      <div className="mb-8">
        <h2 className="font-bold text-gray-700 mb-3 px-1">🎨 スタンプデザイン</h2>
        <div className="grid grid-cols-3 gap-3">
          {STAMP_ITEMS.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              type="stamp"
              owned={ownedStamps.includes(item.id)}
              active={activeStamp === item.id}
              balance={balance}
              onPurchase={() => handlePurchase("stamp", item.id)}
              onActivate={() => handleActivate("stamp", item.id)}
            />
          ))}
        </div>
      </div>

      {/* キャラクター */}
      <div className="mb-8">
        <h2 className="font-bold text-gray-700 mb-3 px-1">🌱 ホームキャラクター</h2>
        <div className="grid grid-cols-3 gap-3">
          {CHARACTER_ITEMS.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              type="character"
              owned={ownedCharacters.includes(item.id)}
              active={activeCharacter === item.id}
              balance={balance}
              onPurchase={() => handlePurchase("character", item.id)}
              onActivate={() => handleActivate("character", item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
