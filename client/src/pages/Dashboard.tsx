import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  User,
  FileText,
  CreditCard,
  LogOut,
  Zap,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import { getLoginUrl } from "@/const";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "總覽" },
  { href: "/dashboard/profile", icon: User, label: "個人資料" },
  { href: "/dashboard/documents", icon: FileText, label: "資料上傳" },
  { href: "/dashboard/loans", icon: CreditCard, label: "我的借款" },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { logout(); window.location.href = "/"; }
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <Zap className="w-4 h-4 text-gold" />
          </div>
          <span className="font-display font-semibold text-navy">閃電貸</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-navy text-white shadow-elegant"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-white fixed top-0 bottom-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────

export default function DashboardHome() {
  const { user } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: document } = trpc.documents.get.useQuery();
  const { data: loans } = trpc.loans.myLoans.useQuery();

  const completionSteps = [
    {
      label: "完成個人資料",
      done: profile?.profileCompleted === "complete",
      href: "/dashboard/profile",
    },
    {
      label: "上傳身份證件",
      done: !!(document?.frontImageUrl && document?.backImageUrl),
      href: "/dashboard/documents",
    },
    {
      label: "提交借款申請",
      done: (loans?.length ?? 0) > 0,
      href: "/dashboard/apply",
    },
  ];

  const completionCount = completionSteps.filter(s => s.done).length;
  const completionPct = Math.round((completionCount / completionSteps.length) * 100);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-navy">
            歡迎回來，{profile?.fullName || user?.name || "會員"}
          </h1>
          <p className="text-muted-foreground mt-1">管理您的借款申請與個人資料</p>
        </div>

        {/* Completion card */}
        <div className="card-elegant p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-navy">帳戶完整度</h2>
              <p className="text-sm text-muted-foreground mt-0.5">完成以下步驟以提交借款申請</p>
            </div>
            <div className="text-3xl font-display font-bold text-gold-dark">{completionPct}%</div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-secondary rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          <div className="space-y-3">
            {completionSteps.map((step) => (
              <Link key={step.href} href={step.href}>
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {!step.done && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent loans */}
        <div className="card-elegant p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-navy">最近申請</h2>
            <Link href="/dashboard/loans">
              <span className="text-sm text-gold-dark hover:text-gold cursor-pointer">查看全部</span>
            </Link>
          </div>

          {!loans || loans.length === 0 ? (
            <div className="text-center py-10">
              <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">尚無借款申請</p>
              <Link href="/dashboard/apply">
                <Button size="sm" className="mt-4 bg-navy text-white hover:bg-navy-light">
                  立即申請借款
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.slice(0, 3).map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      NT$ {Number(loan.loanAmount).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {loan.loanDurationMonths} 個月・{loan.purpose}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium status-${loan.status}`}>
                    {loan.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
