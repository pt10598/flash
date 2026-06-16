import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { LogOut, Zap, LayoutDashboard, Users, FileText, CreditCard, Receipt, ShieldCheck } from "lucide-react";
import { getLoginUrl } from "@/const";

const ADMIN_NAV = [
  { href: "/adminmanagebackstage", icon: LayoutDashboard, label: "儀表板" },
  { href: "/adminmanagebackstage/users", icon: Users, label: "會員管理" },
  { href: "/adminmanagebackstage/admins", icon: ShieldCheck, label: "管理員帳號" },
  { href: "/adminmanagebackstage/loans", icon: CreditCard, label: "借款審核" },
  { href: "/adminmanagebackstage/repayments", icon: Receipt, label: "還款管理" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { logout(); window.location.href = "/"; }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/adminmanagebackstage/login";
    return null;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-navy mb-2">無權限存取</h1>
          <p className="text-muted-foreground mb-4">此頁面僅限管理員使用</p>
          <Link href="/">
            <span className="text-gold-dark hover:underline cursor-pointer">返回首頁</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-navy fixed top-0 bottom-0 left-0 z-30">
        <div className="p-6 border-b border-white/10">
          <Link href="/adminmanagebackstage" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-gold" />
            </div>
            <div>
              <span className="font-display font-semibold text-white text-sm block">閃電貸</span>
              <span className="text-white/40 text-xs">管理後台</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-gold/20 text-gold"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-white/40">登入身份</p>
            <p className="text-sm text-white font-medium truncate">{user?.name || user?.email}</p>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 w-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            登出
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
