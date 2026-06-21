import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation, Link } from "wouter";
import { Zap, ClipboardList, User, Shield, X, MessageCircle } from "lucide-react";

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#1a3a6b]" />
            <h2 className="text-base font-bold text-[#1a3a6b]">個人資料使用同意說明</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-sm text-gray-700 space-y-4">
          <p className="text-xs text-gray-500">最後更新日期：2024 年 1 月 1 日</p>

          <section>
            <h3 className="font-semibold text-[#1a3a6b] mb-1">一、蒐集目的</h3>
            <p className="text-xs leading-relaxed text-gray-600">閃電貸平台（以下稱「本平台」）依據《個人資料保護法》相關規定，於您申請借款、完成身份驗證及使用本平台服務時，蒐集必要之個人資料，用於以下目的：</p>
            <ul className="text-xs text-gray-600 mt-1.5 space-y-1 list-disc list-inside">
              <li>身份驗證及信用審核</li>
              <li>借款申請審查及撥款作業</li>
              <li>帳務管理及還款追蹤</li>
              <li>法令遵循及風險控管</li>
              <li>客戶服務及通知聯繫</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[#1a3a6b] mb-1">二、蒐集項目</h3>
            <p className="text-xs leading-relaxed text-gray-600">本平台蒐集之個人資料包括但不限於：</p>
            <ul className="text-xs text-gray-600 mt-1.5 space-y-1 list-disc list-inside">
              <li>基本資料：姓名、身分證字號、出生年月日、聯絡電話、通訊地址</li>
              <li>財務資料：職業、月收入、銀行帳號資訊</li>
              <li>證件資料：身分證正反面影像、銀行存摺封面影像</li>
              <li>網路識別資料：登入 IP 位址、裝置資訊</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[#1a3a6b] mb-1">三、資料保護措施</h3>
            <p className="text-xs leading-relaxed text-gray-600">本平台採取以下措施保護您的個人資料：</p>
            <ul className="text-xs text-gray-600 mt-1.5 space-y-1 list-disc list-inside">
              <li>所有資料傳輸採用 SSL/TLS 加密</li>
              <li>敏感資料（如密碼）採用不可逆加密儲存</li>
              <li>嚴格限制內部人員存取權限</li>
              <li>定期進行資安稽核與漏洞掃描</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[#1a3a6b] mb-1">四、資料利用期間及範圍</h3>
            <p className="text-xs leading-relaxed text-gray-600">您的個人資料將於借款合約存續期間及法律規定之保存期限內保留。本平台不會將您的個人資料出售、出租或以其他方式提供予無關之第三方，但以下情形除外：</p>
            <ul className="text-xs text-gray-600 mt-1.5 space-y-1 list-disc list-inside">
              <li>依法令規定或主管機關要求</li>
              <li>為完成借貸業務所必要之金融機構</li>
              <li>經您明確同意之情形</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[#1a3a6b] mb-1">五、您的權利</h3>
            <p className="text-xs leading-relaxed text-gray-600">依《個人資料保護法》第三條，您得就本平台保有之個人資料行使以下權利：</p>
            <ul className="text-xs text-gray-600 mt-1.5 space-y-1 list-disc list-inside">
              <li>查詢或請求閱覽</li>
              <li>請求製給複製本</li>
              <li>請求補充或更正</li>
              <li>請求停止蒐集、處理或利用</li>
              <li>請求刪除</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[#1a3a6b] mb-1">六、聯絡方式</h3>
            <p className="text-xs leading-relaxed text-gray-600">如對本個資使用說明有任何疑問，或欲行使上述權利，請透過本平台客服管道與我們聯繫。</p>
          </section>
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#1a3a6b] text-white text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            我已閱讀並了解
          </button>
        </div>
      </div>
    </div>
  );
}

const LOAN_AMOUNTS = [30000, 50000, 100000, 300000, 500000, 1000000];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<number | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
            <p className="text-white text-3xl font-bold tracking-tight">3萬 - 100萬</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs mb-1">最低日利率</p>
            <p className="text-white text-lg font-bold">0.03%<span className="text-sm font-normal">/天</span></p>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-2">降低借款門檻，簡化借款手續</p>

        <div className="flex gap-4 mt-4">
          <div>
            <p className="text-white/60 text-xs">最長借款期數</p>
            <p className="text-white font-semibold text-sm">6 - 120 期</p>
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
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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

      {/* Privacy notice bar */}
      <div className="mx-4 mt-4 mb-2">
        <button
          onClick={() => setShowPrivacy(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-white/50 hover:text-white/70 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs">個人資料使用法律規範</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-2" />

      {/* Privacy Modal */}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

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
        <Link href="/service" className="flex-1">
          <div className="flex flex-col items-center py-3 gap-1 cursor-pointer">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">聯繫客服</span>
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
