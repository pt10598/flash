import { Zap } from "lucide-react";
import { Link } from "wouter";

/**
 * Fallback login page shown when OAuth is not configured (e.g. standalone Heroku deploy).
 * This page informs the user that the login system is being set up.
 */
export default function Login() {
  return (
    <div
      className="min-h-screen bg-[#1a3a6b] flex flex-col items-center justify-center px-6"
      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <span className="text-white font-bold text-2xl tracking-wide">閃電貸</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
        <div className="text-4xl mb-4">🔧</div>
        <h2 className="text-white text-xl font-bold mb-3">會員系統建置中</h2>
        <p className="text-white/70 text-sm leading-relaxed mb-6">
          我們正在為您建置完整的會員登入系統，<br />
          敬請期待正式上線。
        </p>
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <p className="text-white/60 text-xs">預計功能</p>
          <div className="mt-2 space-y-1.5 text-left">
            {["會員註冊 / 登入", "個人資料填寫", "雙證件上傳", "借款申請與追蹤"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <Link href="/">
          <button className="w-full py-3 rounded-xl bg-white text-[#1a3a6b] font-bold text-sm active:scale-[0.98] transition-transform">
            返回首頁
          </button>
        </Link>
      </div>

      <p className="text-white/40 text-xs mt-8">© 2024 閃電貸 版權所有</p>
    </div>
  );
}
