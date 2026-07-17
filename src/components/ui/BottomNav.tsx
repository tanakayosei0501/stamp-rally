"use client";
// =============================================
// ボトムナビゲーション
// "use client" = ブラウザ側で実行(現在のURLを取得するため)
// =============================================
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", icon: "🏠", label: "ホーム" },
  { href: "/goals", icon: "🎯", label: "目標" },
  { href: "/groups", icon: "👥", label: "グループ" },
  { href: "/history", icon: "📅", label: "履歴" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                isActive
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-orange-400"
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
