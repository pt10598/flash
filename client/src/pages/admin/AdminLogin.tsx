import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Zap, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { refresh } = useAuth();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.user.role !== "admin") {
        toast.error("此帳號無管理員權限");
        return;
      }
      await refresh();
      toast.success("登入成功");
      window.location.href = "/adminmanagebackstage";
    },
    onError: (err) => {
      toast.error(err.message || "帳號或密碼錯誤");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim() || !password.trim()) {
      toast.error("請填寫帳號與密碼");
      return;
    }
    loginMutation.mutate({ phone: account.trim(), password, isAdmin: true });
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center mb-4">
            <Zap className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white">閃電貸</h1>
          <p className="text-white/40 text-sm mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            管理員專用入口
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">管理員登入</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">帳號</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="請輸入管理員帳號"
                autoComplete="username"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-gold/60 focus:bg-white/15 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">密碼</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  autoComplete="current-password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder-white/30 text-sm focus:outline-none focus:border-gold/60 focus:bg-white/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gold hover:bg-gold-dark text-navy font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loginMutation.isPending ? "登入中..." : "登入後台"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          此頁面僅限授權管理員使用
        </p>
      </div>
    </div>
  );
}
