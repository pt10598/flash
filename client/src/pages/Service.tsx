import { useEffect } from "react";

const LINE_ID = "dk886dk";
const LINE_URL = `https://line.me/ti/p/~${LINE_ID}`;
const QR_URL = `https://qr-official.line.me/sid/M/${LINE_ID}.png`;

export default function ServicePage() {
  useEffect(() => {
    document.title = "聯繫客服 | 閃電貸";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-start px-4 py-10">
      {/* 頂部標籤 */}
      <div className="mb-6 px-5 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium flex items-center gap-1.5">
        <span>✨</span>
        <span>免費初步評估・不影響聯徵</span>
      </div>

      {/* 主標題 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-3">
          資金安排想更靈活？
        </h1>
        <p className="text-gray-500 text-base">
          線上快速諮詢・專人一對一服務
        </p>
      </div>

      {/* 特色列表 */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-8 space-y-4">
        {[
          "流程簡單・3步驟了解方案",
          "LINE 即時回覆・不用跑銀行",
          "免費初步評估・無壓力諮詢",
        ].map((text) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-gray-800 text-base font-medium">{text}</span>
          </div>
        ))}
      </div>

      {/* LINE 加入按鈕 */}
      <a
        href={LINE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-sm mb-8 flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34c] active:scale-[0.97] text-white text-lg font-bold py-4 rounded-full shadow-lg transition-all duration-150"
        style={{ boxShadow: "0 4px 20px rgba(6,199,85,0.35)" }}
      >
        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        點擊加入 LINE 諮詢
      </a>

      {/* QR Code */}
      <div className="w-full max-w-sm flex flex-col items-center mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          <img
            src={QR_URL}
            alt="LINE QR Code"
            className="w-52 h-52 object-contain"
            onError={(e) => {
              // fallback: use Google Charts QR API
              (e.target as HTMLImageElement).src = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(LINE_URL)}&choe=UTF-8`;
            }}
          />
        </div>

        {/* LINE ID 顯示 */}
        <div className="bg-gray-100 rounded-xl px-6 py-3 mb-4">
          <span className="font-mono font-bold text-gray-800 text-base tracking-widest">
            LINE ID : {LINE_ID}
          </span>
        </div>

        {/* 提示文字 */}
        <p className="text-gray-500 text-sm flex items-center gap-1.5">
          <span>👆</span>
          長按識別 QR Code 或 點擊上方按鈕
        </p>
      </div>

      {/* 底部返回首頁 */}
      <a
        href="/"
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mt-2"
      >
        ← 返回首頁
      </a>
    </div>
  );
}
