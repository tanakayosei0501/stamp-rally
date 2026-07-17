// =============================================
// ログインページ
// =============================================
import Link from "next/link";
import { signIn } from "@/app/auth/actions";

// URLのクエリパラメータからエラーメッセージを受け取る
type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* ロゴ部分 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-gray-800">スタンプラリー</h1>
          <p className="text-gray-500 mt-1 text-sm">月次目標達成アプリ</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error === "Invalid login credentials"
              ? "メールアドレスまたはパスワードが間違っています"
              : error}
          </div>
        )}

        {/* ログインフォーム */}
        {/* action={signIn} でフォーム送信時にサーバーアクションが呼ばれます */}
        <form action={signIn} className="space-y-4">
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
              placeholder="パスワードを入力"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors mt-2"
          >
            ログイン
          </button>
        </form>

        {/* 新規登録リンク */}
        <p className="text-center text-sm text-gray-500 mt-6">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-orange-500 font-medium hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
