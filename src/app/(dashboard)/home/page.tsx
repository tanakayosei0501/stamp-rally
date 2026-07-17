// ホーム画面 (STEP 5-6 で完成させます)
export default function HomePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">今月のスタンプラリー</h1>
          <p className="text-sm text-gray-500">2026年7月</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">
          🎯
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-gray-400">
        <p>STEP 5-6 で目標とスタンプ機能を実装します</p>
      </div>
    </div>
  );
}
