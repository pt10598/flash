import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Link } from "wouter";
import { Users, CreditCard, Clock, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();
  const { data: loans } = trpc.admin.allLoans.useQuery();

  const recentLoans = loans?.slice(0, 5) ?? [];

  const STAT_CARDS = [
    {
      label: "總會員數",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "待審核申請",
      value: stats?.pending ?? 0,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "進行中借款",
      value: stats?.active ?? 0,
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "已結清案件",
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-navy">管理儀表板</h1>
          <p className="text-muted-foreground mt-1">平台整體運營狀況一覽</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className="card-elegant p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-display font-bold text-navy">
                {isLoading ? (
                  <div className="h-8 w-12 bg-secondary rounded animate-pulse" />
                ) : card.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Applications */}
        <div className="card-elegant overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display font-semibold text-navy">最新借款申請</h2>
            <Link href="/admin/loans">
              <span className="text-sm text-gold-dark hover:text-gold cursor-pointer flex items-center gap-1">
                查看全部 <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          {recentLoans.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">尚無借款申請</div>
          ) : (
            <div className="divide-y divide-border">
              {recentLoans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      申請 #{loan.id} ・ NT$ {Number(loan.loanAmount).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {loan.loanDurationMonths} 個月・{loan.purpose}・
                      {new Date(loan.createdAt).toLocaleDateString("zh-TW")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium status-${loan.status}`}>
                      {loan.status}
                    </span>
                    <Link href={`/admin/loans/${loan.id}`}>
                      <span className="text-xs text-navy hover:text-gold-dark cursor-pointer">審核</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
