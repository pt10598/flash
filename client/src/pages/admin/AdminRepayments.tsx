import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function AdminRepayments() {
  const { data: loans, isLoading } = trpc.admin.allLoans.useQuery();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "active" | "overdue">("all");

  // Show loans that are in repayment phase
  const activeLoans = loans?.filter(l =>
    l.status === "還款中" || l.status === "已核准" || l.status === "撥款中"
  ) ?? [];

  const displayLoans = filter === "all" ? activeLoans :
    filter === "active" ? activeLoans.filter(l => l.status === "還款中") :
    activeLoans; // overdue would need repayment data, show all for now

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-navy">還款管理</h1>
          <p className="text-muted-foreground mt-1">追蹤所有進行中借款的還款狀況</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "全部進行中" },
            { key: "active", label: "還款中" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                filter === tab.key
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-muted-foreground border-border hover:border-navy/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-elegant p-5 animate-pulse">
                <div className="h-5 bg-secondary rounded w-1/4 mb-2" />
                <div className="h-4 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayLoans.length === 0 ? (
          <div className="card-elegant p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">目前無進行中的借款</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayLoans.map((loan) => (
              <div key={loan.id} className="card-elegant p-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-display font-semibold text-navy">
                      申請 #{loan.id}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium status-${loan.status}`}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    借款金額：NT$ {Number(loan.loanAmount).toLocaleString()}
                    ・期限：{loan.loanDurationMonths} 個月
                    ・用途：{loan.purpose}
                  </div>
                  {loan.interestRate && (
                    <div className="text-xs text-gold-dark mt-1">
                      利率：{loan.interestRate}%
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-navy/20 text-navy hover:bg-navy/5 flex-shrink-0"
                  onClick={() => navigate(`/admin/loans/${loan.id}`)}
                >
                  管理還款
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6 text-center">
          點擊「管理還款」可進入個別借款的還款紀錄管理頁面
        </p>
      </div>
    </AdminLayout>
  );
}
