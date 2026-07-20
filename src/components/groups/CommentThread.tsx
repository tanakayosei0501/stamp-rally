"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment, deleteComment } from "@/app/(dashboard)/groups/[groupId]/actions";
import type { Comment } from "@/types/database";

type CommentWithProfile = Comment & {
  display_name: string;
};

type Props = {
  achievementId: string;
  comments: CommentWithProfile[];
  currentUserId: string;
  dateLabel: string;
};

export default function CommentThread({
  achievementId,
  comments,
  currentUserId,
  dateLabel,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = inputRef.current?.value ?? "";
    if (!body.trim()) return;
    if (inputRef.current) inputRef.current.value = "";
    startTransition(async () => {
      await addComment(achievementId, body);
      router.refresh();
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-orange-100 pt-3">
      <div className="text-xs text-gray-400 mb-2 font-medium">
        💬 {dateLabel} へのコメント
      </div>

      {/* コメント一覧 */}
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 mt-0.5">
                {c.display_name.charAt(0)}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-1.5">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs font-medium text-gray-700">{c.display_name}</span>
                  <span className="text-[10px] text-gray-300">
                    {new Date(c.created_at).toLocaleString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5 break-all">{c.body}</p>
              </div>
              {c.user_id === currentUserId && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  className="text-gray-300 hover:text-red-400 transition-colors text-xs mt-1 shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* コメント投稿フォーム */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="コメントを入力…（200文字以内）"
          maxLength={200}
          className="flex-1 text-sm bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-300"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-orange-400 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-50 shrink-0"
        >
          送信
        </button>
      </form>
    </div>
  );
}
