import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Calendar,
  Plus,
  Edit2,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  "待審核", "審核中", "已核准", "撥款中", "還款中", "已結清", "已拒絕",
] as const;

const REPAYMENT_METHOD_LABELS: Record<string, string> = {
  equal_principal_interest: "本息平均攤還",
  equal_principal: "本金平均攤還",
  bullet: "到期一次還清",
};

// ─── Loan Detail Page ─────────────────────────────────────────────────────────

function AddRepaymentModal({ loanId, onClose }: { loanId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    dueDate: "",
    amountDue: "",
    amountPaid: "",
    status: "pending" as "pending" | "paid" | "overdue" | "partial",
    notes: "",
  });

  const mutation = trpc.admin.addRepayment.useMutation({
    onSuccess: () => {
      toast.success("還款紀錄已新增");
      utils.admin.loanDetail.invalidate({ loanId });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-display font-semibold text-navy">新增還款紀錄</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">應還日期 *</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">應還金額（NT$）*</Label>
            <Input type="number" placeholder="10000" value={form.amountDue} onChange={(e) => setForm({ ...form, amountDue: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">實際還款金額（NT$）</Label>
            <Input type="number" placeholder="0" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">還款狀態</Label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="pending">待還款</option>
              <option value="paid">已還款</option>
              <option value="partial">部分還款</option>
              <option value="overdue">已逾期</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">備註</Label>
            <Input placeholder="備註說明" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button
            className="w-full bg-navy hover:bg-navy-light text-white"
            onClick={() => mutation.mutate({ loanId, ...form })}
            disabled={!form.dueDate || !form.amountDue || mutation.isPending}
          >
            {mutation.isPending ? "新增中..." : "確認新增"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminLoanDetail() {
  const [, params] = useRoute("/admin/loans/:id");
  const [, navigate] = useLocation();
  const loanId = Number(params?.id);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.loanDetail.useQuery({ loanId });
  const [statusForm, setStatusForm] = useState({ status: "", adminNote: "", interestRate: "", approvedAmount: "", approvedDurationMonths: "" });
  const [showAddRepayment, setShowAddRepayment] = useState(false);

  const updateStatusMutation = trpc.admin.updateLoanStatus.useMutation({
    onSuccess: () => {
      toast.success("申請狀態已更新");
      utils.admin.loanDetail.invalidate({ loanId });
      utils.admin.allLoans.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRepaymentMutation = trpc.admin.updateRepayment.useMutation({
    onSuccess: () => {
      toast.success("還款狀態已更新");
      utils.admin.loanDetail.invalidate({ loanId });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;
  const { loan, repayments } = data;

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-3xl">
        <button
          onClick={() => navigate("/admin/loans")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          返回借款列表
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy">
              借款申請 #{loan.id}
            </h1>
            <p className="text-muted-foreground mt-1">
              {new Date(loan.createdAt).toLocaleDateString("zh-TW")} 提交
            </p>
          </div>
          <span className={`text-sm px-3 py-1.5 rounded-full border font-medium status-${loan.status}`}>
            {loan.status}
          </span>
        </div>

        {/* Loan Info */}
        <div className="card-elegant p-6 mb-5">
          <h2 className="font-display font-semibold text-navy mb-4">申請資訊</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "借款金額", value: `NT$ ${Number(loan.loanAmount).toLocaleString()}` },
              { label: "借款期限", value: `${loan.loanDurationMonths} 個月` },
              { label: "借款用途", value: loan.purpose },
              { label: "還款方式", value: REPAYMENT_METHOD_LABELS[loan.repaymentMethod] || loan.repaymentMethod },
              { label: "核准利率", value: loan.interestRate ? `${loan.interestRate}%` : "未設定" },
              { label: "核准額度", value: (loan as any).approvedAmount ? `NT$ ${Number((loan as any).approvedAmount).toLocaleString()}` : "未設定" },
              { label: "核准期數", value: (loan as any).approvedDurationMonths ? `${(loan as any).approvedDurationMonths} 期` : "未設定" },
              { label: "用戶 ID", value: `#${loan.userId}` },
            ].map((item) => (
              <div key={item.label} className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
          {loan.adminNote && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <span className="font-medium">審核備註：</span>{loan.adminNote}
            </div>
          )}
        </div>

        {/* Status Update */}
        <div className="card-elegant p-6 mb-5">
          <h2 className="font-display font-semibold text-navy mb-4">更新申請狀態</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">申請狀態</Label>
                <select
                  value={statusForm.status || loan.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">核准利率（%）</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="例：10.8"
                  value={statusForm.interestRate}
                  onChange={(e) => setStatusForm({ ...statusForm, interestRate: e.target.value })}
                />
              </div>
            </div>
            {/* 核准額度與期數 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-2">💰 調整核准額度與期數（可覆蓋申請值）</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">核准額度（NT$）</Label>
                  <Input
                    type="number"
                    placeholder={`申請：${Number(loan.loanAmount).toLocaleString()}`}
                    value={statusForm.approvedAmount}
                    onChange={(e) => setStatusForm({ ...statusForm, approvedAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">核准期數（期）</Label>
                  <Input
                    type="number"
                    min="1"
                    max="360"
                    placeholder={`申請：${loan.loanDurationMonths}`}
                    value={statusForm.approvedDurationMonths}
                    onChange={(e) => setStatusForm({ ...statusForm, approvedDurationMonths: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-1.5">若不填寫，則保留原申請的金額與期數</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">審核備註</Label>
              <Input
                placeholder="填寫審核說明或備註"
                value={statusForm.adminNote}
                onChange={(e) => setStatusForm({ ...statusForm, adminNote: e.target.value })}
              />
            </div>
            <Button
              className="w-full bg-navy hover:bg-navy-light text-white btn-press"
              onClick={() => updateStatusMutation.mutate({
                loanId,
                status: (statusForm.status || loan.status) as typeof STATUS_OPTIONS[number],
                adminNote: statusForm.adminNote || undefined,
                interestRate: statusForm.interestRate || undefined,
                approvedAmount: statusForm.approvedAmount || undefined,
                approvedDurationMonths: statusForm.approvedDurationMonths ? Number(statusForm.approvedDurationMonths) : undefined,
              })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "更新中..." : "確認更新狀態"}
            </Button>
          </div>
        </div>

        {/* Repayments */}
        <div className="card-elegant overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display font-semibold text-navy">還款紀錄</h2>
            <Button
              size="sm"
              className="bg-navy hover:bg-navy-light text-white"
              onClick={() => setShowAddRepayment(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              新增紀錄
            </Button>
          </div>

          {repayments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">尚無還款紀錄</div>
          ) : (
            <div className="divide-y divide-border">
              {repayments.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-4">
                  <div className="text-sm">
                    <div className="font-medium">
                      {new Date(r.dueDate).toLocaleDateString("zh-TW")}
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      應還 NT$ {Number(r.amountDue).toLocaleString()}
                      {Number(r.amountPaid) > 0 && ` ・ 已還 NT$ ${Number(r.amountPaid).toLocaleString()}`}
                    </div>
                    {r.notes && <div className="text-xs text-muted-foreground mt-0.5">{r.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateRepaymentMutation.mutate({
                        repaymentId: r.id,
                        status: e.target.value as "pending" | "paid" | "overdue" | "partial",
                      })}
                      className={`text-xs px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                        r.status === "paid" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                        r.status === "overdue" ? "bg-red-50 border-red-200 text-red-700" :
                        r.status === "partial" ? "bg-amber-50 border-amber-200 text-amber-700" :
                        "bg-secondary border-border text-muted-foreground"
                      }`}
                    >
                      <option value="pending">待還款</option>
                      <option value="paid">已還款</option>
                      <option value="partial">部分還款</option>
                      <option value="overdue">已逾期</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddRepayment && (
        <AddRepaymentModal loanId={loanId} onClose={() => setShowAddRepayment(false)} />
      )}
    </AdminLayout>
  );
}

// ─── Loan List Page ───────────────────────────────────────────────────────────

export default function AdminLoans() {
  const { data: loans, isLoading } = trpc.admin.allLoans.useQuery();
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all"
    ? loans ?? []
    : loans?.filter((l) => l.status === filterStatus) ?? [];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-navy">借款審核</h1>
          <p className="text-muted-foreground mt-1">管理所有借款申請與審核流程</p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterStatus === s
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-muted-foreground border-border hover:border-navy/30"
              }`}
            >
              {s === "all" ? "全部" : s}
              {s !== "all" && loans && (
                <span className="ml-1 opacity-60">
                  ({loans.filter(l => l.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="card-elegant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-5 py-3 font-semibold text-navy">申請 ID</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">借款金額</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">期限</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">用途</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">狀態</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">申請時間</th>
                  <th className="text-right px-5 py-3 font-semibold text-navy">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-secondary rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                      尚無借款申請
                    </td>
                  </tr>
                ) : (
                  filtered.map((loan) => (
                    <tr key={loan.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-4 font-medium">#{loan.id}</td>
                      <td className="px-5 py-4 font-semibold text-navy">
                        NT$ {Number(loan.loanAmount).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{loan.loanDurationMonths} 個月</td>
                      <td className="px-5 py-4 text-muted-foreground">{loan.purpose}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium status-${loan.status}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {new Date(loan.createdAt).toLocaleDateString("zh-TW")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          className="bg-navy hover:bg-navy-light text-white"
                          onClick={() => navigate(`/admin/loans/${loan.id}`)}
                        >
                          審核
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
