export type ShopItem = {
  id: string;
  emoji: string;
  name: string;
  cost: number;
  description: string;
};

// スタンプデザイン一覧
export const STAMP_ITEMS: ShopItem[] = [
  { id: "default", emoji: "⭐", name: "スタンダードスター", cost: 0,  description: "デフォルトのスタンプ" },
  { id: "star2",   emoji: "🌟", name: "グローイングスター", cost: 10, description: "きらきら輝く星" },
  { id: "heart",   emoji: "❤️", name: "ハート",             cost: 20, description: "愛情たっぷりスタンプ" },
  { id: "diamond", emoji: "💎", name: "ダイヤモンド",       cost: 25, description: "輝く宝石スタンプ" },
  { id: "fire",    emoji: "🔥", name: "ファイヤー",         cost: 30, description: "情熱の炎スタンプ" },
  { id: "crown",   emoji: "👑", name: "クラウン",           cost: 40, description: "王者の証" },
];

// キャラクター一覧
export const CHARACTER_ITEMS: ShopItem[] = [
  { id: "plant",  emoji: "🌱", name: "育つ草花",   cost: 0,  description: "デフォルトキャラ" },
  { id: "cactus", emoji: "🌵", name: "サボテン",   cost: 30, description: "砂漠でも強く生きる" },
  { id: "chick",  emoji: "🐥", name: "ひよこ",     cost: 35, description: "ぴよぴよがんばる！" },
  { id: "cat",    emoji: "🐱", name: "ネコ",       cost: 50, description: "やる気まんまんネコ" },
  { id: "dog",    emoji: "🐶", name: "イヌ",       cost: 50, description: "忠実なパートナー" },
];

// スタンプ emoji lookup（rare以外に使用）
export const STAMP_EMOJI: Record<string, string> = Object.fromEntries(
  STAMP_ITEMS.map((item) => [item.id, item.emoji])
);

// キャラクターの成長段階 emoji（達成率 100→81→61→41→21→1→0% の順）
export const CHARACTER_STAGES: Record<string, string[]> = {
  plant:  ["🌻", "🌻", "🌺", "🌸", "🌿", "🌱", "🪴"],
  cactus: ["🌵", "🌵", "🌵", "🌵", "🌵", "🌵", "🪴"],
  chick:  ["🦅", "🦅", "🐦", "🐤", "🐥", "🐣", "🥚"],
  cat:    ["😻", "😻", "🥰", "😊", "😺", "😸", "😴"],
  dog:    ["🏆", "🐕‍🦺", "🦮", "🐶", "🐕", "🐾", "😴"],
};
