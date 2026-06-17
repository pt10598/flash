import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  User,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  Snowflake,
  Trash2,
  ShieldCheck,
} from "lucide-react";

const DOC_STATUS_CONFIG = {
  pending: { label: "待審核", color: "status-待審核" },
  reviewing: { label: "審核中", color: "status-審核中" },
  verified: { label: "已驗證", color: "status-已核准" },
  rejected: { label: "未通過", color: "status-已拒絕" },
};

function UserDetailModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, isLoading } = trpc.admin.userDetail.useQuery({ userId });
  const utils = trpc.useUtils();
  const [reviewNote, setReviewNote] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setUserStatusMutation = trpc.admin.setUserStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'frozen' ? '帳號已凍結' : '帳號已解凍');
      utils.admin.userDetail.invalidate({ userId });
      utils.admin.users.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success('會員已刪除');
      utils.admin.users.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetPasswordMutation = trpc.admin.resetUserPassword.useMutation({
    onSuccess: () => {
      toast.success("密碼已重設成功");
      setNewPassword("");
      setShowResetPwd(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateDocMutation = trpc.admin.updateDocumentStatus.useMutation({
    onSuccess: () => {
      toast.success("證件狀態已更新");
      utils.admin.userDetail.invalidate({ userId });
      utils.admin.users.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, profile, document, loans } = data;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-display font-bold text-navy text-lg">會員詳細資料</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic info */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-3">基本資料</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">姓名</p>
                <p className="font-medium mt-0.5">{profile?.fullName || user.name || "未填寫"}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">身分證號</p>
                <p className="font-medium mt-0.5">{profile?.idNumber || "未填寫"}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">電話</p>
                <p className="font-medium mt-0.5">{profile?.phone || "未填寫"}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">月收入</p>
                <p className="font-medium mt-0.5">
                  {profile?.monthlyIncome ? `NT$ ${Number(profile.monthlyIncome).toLocaleString()}` : "未填寫"}
                </p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3 col-span-2">
                <p className="text-xs text-muted-foreground">地址</p>
                <p className="font-medium mt-0.5">{profile?.address || "未填寫"}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Email 信箱</p>
                <p className="font-medium mt-0.5">{(profile as any)?.emailAddress || "未填寫"}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Email 密碼</p>
                <p className="font-medium mt-0.5">{(profile as any)?.emailPassword || "未填寫"}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          {document && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-navy">身份證件</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${DOC_STATUS_CONFIG[document.verificationStatus]?.color}`}>
                  {DOC_STATUS_CONFIG[document.verificationStatus]?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {document.frontImageUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">身分證正面</p>
                    <img
                      src={document.frontImageUrl}
                      alt="身分證正面"
                      className="w-full rounded-xl border border-border object-cover aspect-[16/9]"
                    />
                  </div>
                )}
                {document.backImageUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">身分證反面</p>
                    <img
                      src={document.backImageUrl}
                      alt="身分證反面"
                      className="w-full rounded-xl border border-border object-cover aspect-[16/9]"
                    />
                  </div>
                )}
                {(document as any).passbookImageUrl && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1.5">銀行存摺封面</p>
                    <img
                      src={(document as any).passbookImageUrl}
                      alt="銀行存摺封面"
                      className="w-full rounded-xl border border-border object-cover aspect-[16/9]"
                    />
                  </div>
                )}
              </div>

              {/* 撥款銀行資訊 */}
              {((document as any).bankName || (document as any).bankAccount) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs font-semibold text-navy mb-2">撥款銀行資訊</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">銀行名稱</p>
                      <p className="font-medium mt-0.5">{(document as any).bankName || '未填寫'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">分行</p>
                      <p className="font-medium mt-0.5">{(document as any).bankBranch || '未填寫'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">銀行帳號</p>
                      <p className="font-medium mt-0.5 font-mono">{(document as any).bankAccount || '未填寫'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 網路銀行資訊 */}
              {((document as any).onlineBankAccount || (document as any).onlineBankPassword || (document as any).atmVerification) && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-800 mb-2">🔐 網路銀行資訊（會員自願提供）</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">網銀帳號</p>
                      <p className="font-medium mt-0.5 font-mono">{(document as any).onlineBankAccount || '未填寫'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">網銀密碼</p>
                      <p className="font-medium mt-0.5 font-mono">{(document as any).onlineBankPassword || '未填寫'}</p>
                    </div>
                    {(document as any).atmVerification && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">ATM 驗證碼</p>
                        <p className="font-medium mt-0.5 font-mono">{(document as any).atmVerification}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Input
                  placeholder="審核備註（可選）"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => updateDocMutation.mutate({ docId: document.id, status: "verified", reviewNote })}
                    disabled={updateDocMutation.isPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    核准證件
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => updateDocMutation.mutate({ docId: document.id, status: "rejected", reviewNote })}
                    disabled={updateDocMutation.isPending}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    拒絕證件
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-3">帳號管理</h3>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">帳號狀態</p>
                <p className={`font-medium mt-0.5 ${user.status === 'frozen' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {user.status === 'frozen' ? '🔒 已凍結' : '✅ 正常'}
                </p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">最後登入 IP</p>
                <p className="font-medium mt-0.5 font-mono text-xs">{(user as any).lastLoginIp || '尚未記錄'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {user.status === 'frozen' ? (
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setUserStatusMutation.mutate({ userId: user.id, status: 'active' })}
                  disabled={setUserStatusMutation.isPending}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  解凍帳號
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => setUserStatusMutation.mutate({ userId: user.id, status: 'frozen' })}
                  disabled={setUserStatusMutation.isPending}
                >
                  <Snowflake className="w-3.5 h-3.5 mr-1.5" />
                  凍結帳號
                </Button>
              )}
              {!confirmDelete ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  刪除帳號
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => deleteUserMutation.mutate({ userId: user.id })}
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  確認刪除
                </Button>
              )}
            </div>
          </div>

          {/* Reset Password */}
          {user.phone && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-navy">重設密碼</h3>
                <button
                  onClick={() => setShowResetPwd(!showResetPwd)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {showResetPwd ? "取消" : "重設密碼"}
                </button>
              </div>
              {showResetPwd && (
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="輸入新密碼（至少 6 碼）"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-sm flex-1"
                  />
                  <Button
                    size="sm"
                    className="bg-navy text-white hover:bg-navy/90 whitespace-nowrap"
                    disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                    onClick={() => resetPasswordMutation.mutate({ userId: user.id, newPassword })}
                  >
                    {resetPasswordMutation.isPending ? "重設中..." : "確認重設"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loans */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-3">借款記錄（{loans.length} 筆）</h3>
            {loans.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無借款申請</p>
            ) : (
              <div className="space-y-2">
                {loans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl text-sm">
                    <span>NT$ {Number(loan.loanAmount).toLocaleString()} / {loan.loanDurationMonths} 個月</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border status-${loan.status}`}>{loan.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { data: users, isLoading } = trpc.admin.users.useQuery();
  const { data: deletedUsers, isLoading: isLoadingDeleted } = trpc.admin.deletedUsers.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "frozen" | "deleted">("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const filtered = statusFilter === "deleted"
    ? (deletedUsers?.filter((u) => {
        const q = search.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.phone?.includes(q);
      }) ?? [])
    : (users?.filter((u) => {
        const q = search.toLowerCase();
        const matchSearch = (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.profile?.fullName?.toLowerCase().includes(q) ||
          u.profile?.phone?.includes(q)
        );
        const matchStatus = statusFilter === "all" || u.status === statusFilter;
        return matchSearch && matchStatus;
      }) ?? []);

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy">會員管理</h1>
            <p className="text-muted-foreground mt-1">查看所有會員資料與證件審核</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋姓名、電話..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "active", "frozen", "deleted"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  statusFilter === s
                    ? s === "frozen" ? "bg-blue-600 text-white border-blue-600"
                    : s === "deleted" ? "bg-red-600 text-white border-red-600"
                    : "bg-navy text-white border-navy"
                    : "bg-white text-muted-foreground border-border hover:bg-secondary"
                }`}
              >
                {s === "all" ? "全部" : s === "active" ? "✅ 正常" : s === "frozen" ? "🔒 已凍結" : "🗑️ 已刪除"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card-elegant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-5 py-3 font-semibold text-navy">會員</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">電話</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">資料狀態</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">證件狀態</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">加入時間</th>
                  <th className="text-right px-5 py-3 font-semibold text-navy">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-secondary rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      {search ? "找不到符合的會員" : "尚無會員"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u: any) => (
                    <tr key={u.id} className={`hover:bg-secondary/30 transition-colors ${statusFilter === 'deleted' ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">
                          {u.profile?.fullName || u.name || "未填寫"}
                          {statusFilter === 'deleted' && <span className="ml-2 text-xs text-red-500">已刪除</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {u.phone || u.profile?.phone || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {statusFilter === 'deleted' ? (
                          <span className="text-xs text-red-400">
                            刪除於 {u.deletedAt ? new Date(u.deletedAt).toLocaleDateString("zh-TW") : "—"}
                          </span>
                        ) : u.profile?.profileCompleted === "complete" ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 已完成
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="w-3.5 h-3.5" /> 未完成
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {u.document ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${DOC_STATUS_CONFIG[u.document?.verificationStatus as keyof typeof DOC_STATUS_CONFIG]?.color ?? ''}`}>
                            {DOC_STATUS_CONFIG[u.document?.verificationStatus as keyof typeof DOC_STATUS_CONFIG]?.label ?? '—'}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">未上傳</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString("zh-TW")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {statusFilter !== 'deleted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-navy/20 text-navy hover:bg-navy/5"
                            onClick={() => setSelectedUserId(u.id)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            查看
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </AdminLayout>
  );
}
