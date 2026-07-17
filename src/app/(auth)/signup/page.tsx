// =============================================
// 新規登録ページ
// =============================================
import Link from "next/link";
import { signUp } from "@/app/auth/actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* ロゴ部分 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌟</div>
          <h1 className="text-2xl font-bold text-gray-800">アカウント作成</h1>
          <p className="text-gray-500 mt-1 text-sm">スタンプラリーを始めよう！</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 新規登録フォーム */}
        <form action={signUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表示名
            </label>
            <input
              type="text"
              name="display_name"
              required
              placeholder="アプリ内で表示される名前"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="6文字以上"
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors mt-2"
          >
            アカウントを作成
          </button>
        </form>

        {/* ログインリンク */}
        <p className="text-center text-sm text-gray-500 mt-6">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-orange-500 font-medium hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
