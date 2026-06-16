import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, Eye, EyeOff, KeyRound } from "lucide-react";

export default function AdminAdmins() {
  const { data: admins, isLoading } = trpc.admin.admins.useQuery();
  const utils = trpc.useUtils();

  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const resetPasswordMutation = trpc.admin.resetUserPassword.useMutation({
    onSuccess: () => {
      toast.success("密碼已重設成功");
      setNewPassword("");
      setResetTarget(null);
      utils.admin.admins.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy">管理員帳號</h1>
            <p className="text-muted-foreground mt-1">管理後台管理員帳號與密碼</p>
          </div>
        </div>

        <div className="card-elegant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-5 py-3 font-semibold text-navy">帳號</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">名稱</th>
                  <th className="text-left px-5 py-3 font-semibold text-navy">加入時間</th>
                  <th className="text-right px-5 py-3 font-semibold text-navy">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-secondary rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !admins || admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                      尚無管理員帳號
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <>
                      <tr key={admin.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-gold" />
                            <span className="font-medium font-mono">{admin.phone}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {admin.name || "—"}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">
                          {new Date(admin.createdAt).toLocaleDateString("zh-TW")}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-navy/20 text-navy hover:bg-navy/5"
                            onClick={() => setResetTarget(resetTarget === admin.id ? null : admin.id)}
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                            重設密碼
                          </Button>
                        </td>
                      </tr>
                      {resetTarget === admin.id && (
                        <tr key={`reset-${admin.id}`} className="bg-secondary/20">
                          <td colSpan={4} className="px-5 py-4">
                            <div className="flex items-center gap-2 max-w-sm">
                              <div className="relative flex-1">
                                <Input
                                  type={showPwd ? "text" : "password"}
                                  placeholder="輸入新密碼（至少 6 碼）"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="text-sm pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPwd(!showPwd)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                              <Button
                                size="sm"
                                className="bg-navy text-white hover:bg-navy/90 whitespace-nowrap"
                                disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                                onClick={() => resetPasswordMutation.mutate({ userId: admin.id, newPassword })}
                              >
                                {resetPasswordMutation.isPending ? "重設中..." : "確認重設"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setResetTarget(null); setNewPassword(""); }}
                              >
                                取消
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
