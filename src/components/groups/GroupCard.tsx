"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leaveGroup } from "@/app/(dashboard)/groups/actions";

type MemberProgress = {
  userId: string;
  displayName: string;
  stamps: number;        // 今月の合計スタンプ数
  goalCount: number;     // 今月の目標数
  achievedToday: boolean;
  isMe: boolean;
};

type Props = {
  groupId: string;
  groupName: string;
  inviteCode: string;
  members: MemberProgress[];
  currentUserId: string;
};

export default function GroupCard({
  groupId,
  groupName,
  inviteCode,
  members,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // 招待コードをクリップボードにコピー
  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!confirm(`「${groupName}」から退出しますか？`)) return;
    setIsLeaving(true);
    await leaveGroup(groupId);
    router.refresh();
  }

  // スタンプ数でソート（多い順）
  const sorted = [...members].sort((a, b) => b.stamps - a.stamps);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* グループヘッダー */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{groupName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{members.length}人のメンバー</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/groups/${groupId}`}
              className="text-xs text-orange-500 hover:text-orange-600 font-medium px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
            >
              詳細 ›
            </Link>
            <button
              onClick={handleLeave}
              disabled={isLeaving}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
            >
              退出
            </button>
          </div>
        </div>

        {/* 招待コード */}
        <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-500">招待コード</span>
          <span className="font-mono font-bold text-gray-800 tracking-widest flex-1">
            {inviteCode}
          </span>
          <button
            onClick={handleCopy}
            className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
              copied
                ? "bg-green-100 text-green-600"
                : "bg-orange-100 text-orange-600 hover:bg-orange-200"
            }`}
          >
            {copied ? "✅ コピー済み" : "📋 コピー"}
          </button>
        </div>
      </div>

      {/* メンバー一覧 */}
      <div className="divide-y divide-gray-50">
        {sorted.map((member, index) => (
          <div key={member.userId} className="px-4 py-3 flex items-center gap-3">
            {/* 順位 */}
            <div className={`w-6 text-center text-sm font-bold ${
              index === 0 ? "text-yellow-500" :
              index === 1 ? "text-gray-400" :
              index === 2 ? "text-amber-600" : "text-gray-300"
            }`}>
              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
            </div>

            {/* アバター */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
              member.isMe ? "bg-orange-400" : "bg-gray-300"
            }`}>
              {member.displayName.charAt(0)}
            </div>

            {/* 名前 */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 text-sm">
                {member.displayName}
                {member.isMe && (
                  <span className="ml-1 text-xs text-orange-400 font-normal">（自分）</span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {member.goalCount > 0
                  ? `今月${member.goalCount}個の目標`
                  : "今月の目標なし"}
              </div>
            </div>

            {/* 今日達成バッジ */}
            <div className="flex items-center gap-2 shrink-0">
              {member.achievedToday && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                  今日✅
                </span>
              )}
              <div className="text-right">
                <div className="font-bold text-gray-800">
                  ⭐ {member.stamps}
                </div>
                <div className="text-xs text-gray-400">スタンプ</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
