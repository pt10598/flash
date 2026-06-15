import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DashboardLayout } from "./Dashboard";
import { CheckCircle2, User } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "請輸入完整姓名"),
  idNumber: z.string().min(10, "身分證號格式不正確").max(10, "身分證號格式不正確"),
  phone: z.string().min(9, "請輸入有效電話號碼"),
  address: z.string().min(5, "請輸入完整地址"),
  occupation: z.string().optional(),
  monthlyIncome: z.string().optional(),
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
      </div>
    </DashboardLayout>
  );
}
