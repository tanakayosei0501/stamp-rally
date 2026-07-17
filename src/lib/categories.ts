// カテゴリの定義（サーバー・クライアント両方から安全に import できる）
export const CATEGORIES = [
  { value: "健康", emoji: "💪", color: "bg-green-100 text-green-700" },
  { value: "仕事", emoji: "💼", color: "bg-blue-100 text-blue-700" },
  { value: "趣味", emoji: "🎨", color: "bg-purple-100 text-purple-700" },
  { value: "学習", emoji: "📚", color: "bg-yellow-100 text-yellow-700" },
  { value: "その他", emoji: "✨", color: "bg-gray-100 text-gray-700" },
] as const;
