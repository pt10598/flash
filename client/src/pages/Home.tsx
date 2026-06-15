import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation, Link } from "wouter";
import { Zap, ClipboardList, User } from "lucide-react";

const LOAN_AMOUNTS = [5000, 10000, 20000, 30000, 50000, 100000];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<number | null>(null);

  const handleApply = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    navigate("/dashboard/apply");
  };

  return (
    <div className="min-h-screen bg-[#1a3a6b] flex flex-col" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">閃電貸</span>
        </div>
        {!loading && !isAuthenticated && (
          <a
            href={getLoginUrl()}
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            登入 / 註冊
          </a>
        )}
        {!loading && isAuthenticated && (
          <Link href="/dashboard">
            <span className="text-sm text-white/80 hover:text-white transition-colors cursor-pointer">
              會員中心
            </span>
          </Link>
        )}
      </div>

      {/* Hero card */}
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] p-5 shadow-xl">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-white/70 text-xs mb-1">可申請額度（NT$）</p>
            <p className="text-white text-3xl font-bold tracking-tight">5,000 - 500,000</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs mb-1">最低日利率</p>
            <p className="text-white text-lg font-bold">0.03%<span className="text-sm font-normal">/天</span></p>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-2">降低借款門檻，簡化借款手續</p>

        <div className="flex gap-4 mt-4">
          <div>
            <p className="text-white/60 text-xs">最長借款週期</p>
            <p className="text-white font-semibold text-sm">91 - 365 天</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-white/60 text-xs">審核時間</p>
            <p className="text-white font-semibold text-sm">最快 24 小時</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-white/60 text-xs">通過率</p>
            <p className="text-white font-semibold text-sm">98.2%</p>
          </div>
        </div>
      </div>

      {/* Amount selection */}
      <div className="mx-4 mt-5">
        <p className="text-white/80 text-sm mb-3 font-medium">選擇借款金額</p>
        <div className="grid grid-cols-3 gap-2.5">
          {LOAN_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelected(amount)}
              className={`py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                selected === amount
                  ? "bg-white text-[#1a3a6b] shadow-lg scale-[1.02]"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
              }`}
            >
              {amount >= 10000
                ? `${amount / 10000} 萬`
                : `${amount.toLocaleString()}`}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mx-4 mt-5 space-y-3">
        <button
          onClick={handleApply}
          className="w-full py-4 rounded-2xl bg-white text-[#1a3a6b] font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
        >
          {selected
            ? `申請借款 NT$ ${selected.toLocaleString()}`
            : "查看並申請借款（24 小時服務）"}
        </button>

        {!isAuthenticated && !loading && (
          <button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full py-3.5 rounded-2xl bg-white/10 text-white font-medium text-sm border border-white/20 active:scale-[0.98] transition-transform"
          >
            登入後查看免審額度
          </button>
        )}
      </div>

      {/* Features row */}
      <div className="mx-4 mt-6 grid grid-cols-2 gap-3">
        {[
          { icon: "⚡", title: "高效服務", desc: "24 小時服務，快速審核" },
          { icon: "🏦", title: "到帳快", desc: "核准後快速撥款" },
          { icon: "🌐", title: "全線上", desc: "無需照會，線上完成" },
          { icon: "✅", title: "通過率高", desc: "不拒審，人人可申請" },
        ].map((f) => (
          <div key={f.title} className="bg-white/10 rounded-xl p-3.5 border border-white/10">
            <div className="text-xl mb-1">{f.icon}</div>
            <p className="text-white text-sm font-semibold">{f.title}</p>
            <p className="text-white/60 text-xs mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-8" />

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 flex">
        <Link href="/" className="flex-1">
          <div className="flex flex-col items-center py-3 gap-1 cursor-pointer">
            <Zap className="w-5 h-5 text-[#2563eb]" />
            <span className="text-xs text-[#2563eb] font-medium">貸款入口</span>
          </div>
        </Link>
        <Link href={isAuthenticated ? "/dashboard/loans" : getLoginUrl()} className="flex-1">
          <div className="flex flex-col items-center py-3 gap-1 cursor-pointer">
            <ClipboardList className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">訂單中心</span>
          </div>
        </Link>
        <Link href={isAuthenticated ? "/dashboard" : getLoginUrl()} className="flex-1">
          <div className="flex flex-col items-center py-3 gap-1 cursor-pointer">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">個人中心</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
