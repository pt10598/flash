import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "./Dashboard";
import { Link } from "wouter";
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const STATUS_STEPS = [
  "待審核", "審核中", "已核准", "撥款中", "還款中", "已結清",
] as const;

const REPAYMENT_METHOD_LABELS = {
  equal_principal_interest: "本息平均攤還",
  equal_principal: "本金平均攤還",
  bullet: "到期一次還清",
};

function StatusTimeline({ status }: { status: string }) {
  if (status === "已拒絕") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <XCircle className="w-4 h-4" />
        申請已拒絕
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              isCurrent
                ? `status-${step} font-semibold`
                : isDone
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-secondary text-muted-foreground border-transparent"
            }`}>
              {isDone && <CheckCircle2 className="w-3 h-3" />}
              {step}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`w-4 h-px ${i < currentIndex ? "bg-emerald-300" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoanCard({ loan }: { loan: any }) {
  const [expanded, setExpanded] = useState(false);
  const { data: repayments } = trpc.loans.repayments.useQuery(
    { loanId: loan.id },
    { enabled: expanded }
  );

  return (
    <div className="card-elegant overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xl font-display font-bold text-navy">
              NT$ {Number(loan.loanAmount).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {loan.loanDurationMonths} 個月・{loan.purpose}・{REPAYMENT_METHOD_LABELS[loan.repaymentMethod as keyof typeof REPAYMENT_METHOD_LABELS]}
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 status-${loan.status}`}>
            {loan.status}
          </span>
        </div>

        <StatusTimeline status={loan.status} />

        {loan.interestRate && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">核准利率：</span>
            <span className="font-semibold text-gold-dark">{loan.interestRate}%</span>
          </div>
        )}

        {loan.adminNote && (
          <div className="mt-3 p-3 rounded-lg bg-secondary/60 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">審核備註：</span>{loan.adminNote}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            申請時間：{new Date(loan.createdAt).toLocaleDateString("zh-TW")}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-navy hover:text-gold-dark transition-colors"
          >
            {expanded ? "收起" : "還款明細"}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Repayments */}
      {expanded && (
        <div className="border-t border-border bg-secondary/30 p-5">
          <h4 className="text-sm font-semibold text-navy mb-3">還款紀錄</h4>
          {!repayments || repayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無還款紀錄</p>
          ) : (
            <div className="space-y-2">
              {repayments.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {r.status === "paid" ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : r.status === "overdue" ? (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">
                      {new Date(r.dueDate).toLocaleDateString("zh-TW")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">NT$ {Number(r.amountDue).toLocaleString()}</span>
                    {r.status === "paid" && r.paidAt && (
                      <p className="text-xs text-success">
                        已於 {new Date(r.paidAt).toLocaleDateString("zh-TW")} 還款
                      </p>
                    )}
                    {r.status === "overdue" && (
                      <p className="text-xs text-destructive">已逾期</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoansPage() {
  const { data: loans, isLoading } = trpc.loans.myLoans.useQuery();

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy mb-1">我的借款</h1>
            <p className="text-muted-foreground">查看所有借款申請與還款狀態</p>
          </div>
          <Link href="/dashboard/apply">
            <Button className="bg-navy hover:bg-navy-light text-white btn-press" size="sm">
              申請新借款
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="card-elegant p-5 animate-pulse">
                <div className="h-6 bg-secondary rounded w-1/3 mb-3" />
                <div className="h-4 bg-secondary rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !loans || loans.length === 0 ? (
          <div className="card-elegant p-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-navy mb-2">尚無借款申請</h3>
            <p className="text-sm text-muted-foreground mb-6">立即申請借款，享受快速審核服務</p>
            <Link href="/dashboard/apply">
              <Button className="bg-navy hover:bg-navy-light text-white btn-press">
                立即申請借款
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
