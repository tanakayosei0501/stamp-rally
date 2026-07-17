// =============================================
// Next.js ミドルウェア
// 全ページへのリクエストで実行され、ログイン状態を確認します
// 未ログインユーザーがダッシュボードにアクセスしようとしたら
// ログインページにリダイレクトします
// =============================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッション(ログイン状態)を更新・確認
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ログインが必要なページへのアクセスを制限
  const protectedPaths = ["/home", "/goals", "/groups", "/history"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !user) {
    // 未ログインならログインページへ
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ログイン済みでログイン/新規登録ページへアクセスしたらホームへ
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return supabaseResponse;
}

// ミドルウェアを適用するパスのパターン
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
