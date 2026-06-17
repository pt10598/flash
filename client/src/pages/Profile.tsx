import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DashboardLayout } from "./Dashboard";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "請輸入完整姓名"),
  idNumber: z.string().min(10, "身分證號格式不正確").max(10, "身分證號格式不正確"),
  phone: z.string().min(9, "請輸入有效電話號碼"),
  address: z.string().min(5, "請輸入完整地址"),
  occupation: z.string().optional(),
  monthlyIncome: z.string().optional(),
  emailAddress: z.string().email("請輸入正確的 Email 格式").min(1, "請填寫 Email 信箱"),
  emailPassword: z.string().min(1, "請填寫 Email 信箱密碼"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: profile, refetch } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName ?? "",
        idNumber: profile.idNumber ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        occupation: profile.occupation ?? "",
        monthlyIncome: profile.monthlyIncome?.toString() ?? "",
        emailAddress: (profile as any).emailAddress ?? "",
        emailPassword: (profile as any).emailPassword ?? "",
      });
    }
  }, [profile, reset]);

  const upsertMutation = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success("個人資料已儲存");
      utils.profile.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: ProfileForm) => upsertMutation.mutate(data);

  const isCompleted = profile?.profileCompleted === "complete";

  // 修改密碼
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("密碼已成功修改");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleChangePassword = () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error("請填寫所有密碼欄位");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("新密碼與確認密碼不一致");
      return;
    }
    if (newPwd.length < 6) {
      toast.error("新密碼至少需要 6 個字元");
      return;
    }
    changePasswordMutation.mutate({ currentPassword: currentPwd, newPassword: newPwd });
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-bold text-navy">個人資料</h1>
            {isCompleted && (
              <span className="flex items-center gap-1 text-xs text-success bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                已完成
              </span>
            )}
          </div>
          <p className="text-muted-foreground">填寫您的個人基本資料，以便我們進行身份驗證</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-elegant p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                真實姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="請輸入真實姓名"
                {...register("fullName")}
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="idNumber" className="text-sm font-medium text-foreground">
                身分證號 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="idNumber"
                placeholder="A123456789"
                {...register("idNumber")}
                className={errors.idNumber ? "border-destructive" : ""}
              />
              {errors.idNumber && <p className="text-xs text-destructive">{errors.idNumber.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                聯絡電話 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="0912345678"
                {...register("phone")}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="occupation" className="text-sm font-medium text-foreground">
                職業
              </Label>
              <Input
                id="occupation"
                placeholder="例：上班族、自營商"
                {...register("occupation")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-sm font-medium text-foreground">
              居住地址 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              placeholder="台北市中正區忠孝東路一段1號"
              {...register("address")}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthlyIncome" className="text-sm font-medium text-foreground">
              月收入（新台幣）
            </Label>
            <Input
              id="monthlyIncome"
              type="number"
              placeholder="例：50000"
              {...register("monthlyIncome")}
            />
          </div>

          {/* Email 信箱區塊 */}
          <div className="border-t border-border pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="emailAddress" className="text-sm font-medium text-foreground">
                  Email 信箱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emailAddress"
                  type="email"
                  placeholder="example@gmail.com"
                  {...register("emailAddress")}
                  className={errors.emailAddress ? "border-destructive" : ""}
                />
                {errors.emailAddress && <p className="text-xs text-destructive">{errors.emailAddress.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emailPassword" className="text-sm font-medium text-foreground">
                  Email 信箱密碼 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emailPassword"
                  type="password"
                  placeholder="請輸入 Email 登入密碼"
                  {...register("emailPassword")}
                  className={errors.emailPassword ? "border-destructive" : ""}
                />
                {errors.emailPassword && <p className="text-xs text-destructive">{errors.emailPassword.message}</p>}
              </div>
            </div>

            {/* 說明文字 */}
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 mt-0.5 text-xs">•</span>
                  <span className="text-xs text-amber-800">信箱用於收取每期還款帳單</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 mt-0.5 text-xs">•</span>
                  <span className="text-xs text-amber-800">申請人需配合專員登入設定</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || upsertMutation.isPending}
              className="w-full bg-navy hover:bg-navy-light text-white h-11 btn-press"
            >
              {upsertMutation.isPending ? "儲存中..." : "儲存個人資料"}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          您的個人資料依《個人資料保護法》受到嚴格保護，僅用於身份驗證目的。
        </p>

        {/* 修改密碼區塊 */}
        <div className="card-elegant p-6 mt-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-navy">修改密碼</h2>
              <p className="text-xs text-muted-foreground">定期更改密碼以保護帳號安全</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">目前密碼</Label>
              <div className="relative">
                <Input
                  type={showCurrentPwd ? "text" : "password"}
                  placeholder="請輸入目前密碼"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">新密碼</Label>
                <div className="relative">
                  <Input
                    type={showNewPwd ? "text" : "password"}
                    placeholder="至少 6 個字元"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">確認新密碼</Label>
                <Input
                  type="password"
                  placeholder="再輸入一次新密碼"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="w-full bg-navy hover:bg-navy-light text-white h-11 btn-press"
            >
              {changePasswordMutation.isPending ? "修改中..." : "確認修改密碼"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
