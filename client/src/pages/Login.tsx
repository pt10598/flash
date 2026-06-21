import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Zap, Phone, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Mode = "login" | "register";

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("登入成功！");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "登入失敗，請再試一次");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("註冊成功！歡迎加入閃電貸");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "註冊失敗，請再試一次");
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("請填寫手機號碼和密碼");
      return;
    }
    // 驗證台灣手機號碼格式
    if (!/^09\d{8}$/.test(phone)) {
      toast.error("請輸入正確的手機號碼（09 開頭，共 10 碼）");
      return;
    }
    if (mode === "login") {
      loginMutation.mutate({ phone, password, isAdmin: false });
    } else {
      if (password.length < 6) {
        toast.error("密碼至少需要 6 個字元");
        return;
      }
      registerMutation.mutate({ phone, password, name: name || undefined });
    }
  };

  return (
    <div
      className="min-h-screen bg-[#1a3a6b] flex flex-col"
      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex items-center px-5 pt-6 pb-2">
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mr-3 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">閃電貸</span>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 mt-6 mb-8">
        <h1 className="text-white text-2xl font-bold mb-1">
          {mode === "login" ? "歡迎回來" : "建立帳號"}
        </h1>
        <p className="text-white/60 text-sm">
          {mode === "login" ? "登入以繼續使用借貸服務" : "註冊成為閃電貸會員"}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mx-5 mb-6">
        <div className="bg-white/10 rounded-xl p-1 flex">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === "login"
                ? "bg-white text-[#1a3a6b] shadow"
                : "text-white/70"
            }`}
          >
            登入
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === "register"
                ? "bg-white text-[#1a3a6b] shadow"
                : "text-white/70"
            }`}
          >
            註冊
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-5 space-y-4">
        {/* Name (register only) */}
        {mode === "register" && (
          <div>
            <label className="text-white/70 text-xs mb-1.5 block">姓名（選填）</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入您的姓名"
                className="w-full bg-white/10 border border-white/15 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              />
            </div>
          </div>
        )}

        {/* Phone */}
        <div>
          <label className="text-white/70 text-xs mb-1.5 block">手機號碼</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例：0912345678"
              className="w-full bg-white/10 border border-white/15 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-white/70 text-xs mb-1.5 block">
            密碼{mode === "register" && "（至少 6 個字元）"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "設定密碼（至少 6 碼）" : "請輸入密碼"}
              className="w-full bg-white/10 border border-white/15 rounded-xl py-3.5 pl-10 pr-12 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-white text-[#1a3a6b] font-bold text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading
              ? (mode === "login" ? "登入中..." : "註冊中...")
              : (mode === "login" ? "登入" : "立即註冊")}
          </button>
        </div>
      </form>

      {/* Footer note */}
      <div className="mx-5 mt-6">
        <p className="text-white/40 text-xs text-center leading-relaxed">
          {mode === "register"
            ? "註冊即表示您同意閃電貸的服務條款與隱私政策"
            : <>忘記密碼？請<Link href="/service" className="text-white/70 underline underline-offset-2 hover:text-white transition-colors">聯繫客服</Link>協助重設</>}
        </p>
      </div>

      {/* Security badge */}
      <div className="mx-5 mt-4 bg-white/5 rounded-xl p-3 flex items-center gap-2.5 border border-white/10">
        <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-green-400 text-sm">🔒</span>
        </div>
        <div>
          <p className="text-white/70 text-xs font-medium">安全加密保護</p>
          <p className="text-white/40 text-xs">您的個人資料受到 SSL 加密保護</p>
        </div>
      </div>

      <div className="flex-1 min-h-8" />
    </div>
  );
}
