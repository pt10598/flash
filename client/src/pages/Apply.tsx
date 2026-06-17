import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DashboardLayout } from "./Dashboard";
import { useLocation } from "wouter";
import {
  CheckCircle2,
  AlertCircle,
  Calculator,
  ChevronDown,
} from "lucide-react";

const PURPOSES = [
  "日常週轉", "醫療費用", "教育費用", "旅遊費用",
  "家庭裝修", "創業資金", "車輛購置", "其他",
];

const REPAYMENT_METHODS = [
  { value: "equal_principal_interest", label: "本息平均攤還", desc: "每月還款金額固定，適合預算規劃" },
  { value: "equal_principal", label: "本金平均攤還", desc: "每月本金固定，利息遞減，總利息較少" },
  { value: "bullet", label: "到期一次還清", desc: "期間只還利息，到期還清本金" },
] as const;

const applySchema = z.object({
  loanAmount: z.string().min(1, "請輸入借款金額"),
  loanDurationMonths: z.number().int().min(6).max(120),
  purpose: z.string().min(1, "請選擇借款用途"),
  repaymentMethod: z.enum(["equal_principal_interest", "equal_principal", "bullet"]),
});

type ApplyForm = z.infer<typeof applySchema>;

export default function ApplyPage() {
  const [, navigate] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: document } = trpc.documents.get.useQuery();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      loanDurationMonths: 12,
      repaymentMethod: "equal_principal_interest",
    },
  });

  const createMutation = trpc.loans.create.useMutation({
    onSuccess: () => {
      toast.success("借款申請已提交，我們將盡快審核");
      navigate("/dashboard/loans");
    },
    onError: (err) => toast.error(err.message),
  });

  const watchAmount = watch("loanAmount");
  const watchDuration = watch("loanDurationMonths");
  const watchMethod = watch("repaymentMethod");

  // Simple monthly payment estimate (8% annual rate)
  const estimateMonthlyPayment = () => {
    const amount = Number(watchAmount);
    const months = watchDuration;
    if (!amount || !months) return null;
    const monthlyRate = 0.08 / 12;
    if (watchMethod === "bullet") {
      return Math.round(amount * monthlyRate);
    }
    if (watchMethod === "equal_principal") {
      return Math.round(amount / months + amount * monthlyRate);
    }
    // equal_principal_interest
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment);
  };

  const monthlyPayment = estimateMonthlyPayment();

  const profileComplete = profile?.profileCompleted === "complete";
  const docsUploaded = !!(document?.frontImageUrl && document?.backImageUrl);
  const canApply = profileComplete && docsUploaded;

  const onSubmit = (data: ApplyForm) => {
    createMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-navy mb-2">申請借款</h1>
          <p className="text-muted-foreground">填寫借款資訊，提交後由專業團隊審核</p>
        </div>

        {/* Prerequisites warning */}
        {!canApply && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">請先完成以下步驟</p>
              <ul className="text-xs text-amber-700 mt-1.5 space-y-1">
                {!profileComplete && <li>• 完成個人資料填寫</li>}
                {!docsUploaded && <li>• 上傳身份證件（正面與反面）</li>}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Amount */}
          <div className="card-elegant p-6">
            <h2 className="font-display font-semibold text-navy mb-4">借款金額</h2>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                借款金額（新台幣）<span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">NT$</span>
                <Input
                  type="number"
                  placeholder="50,000"
                  className={`pl-10 ${errors.loanAmount ? "border-destructive" : ""}`}
                  {...register("loanAmount")}
                  min="30000"
                  max="10000000"
                />
              </div>
              {errors.loanAmount && <p className="text-xs text-destructive">{errors.loanAmount.message}</p>}
              <p className="text-xs text-muted-foreground">最低 NT$30,000，最高 NT$10,000,000</p>
            </div>
          </div>

          {/* Duration */}
          <div className="card-elegant p-6">
            <h2 className="font-display font-semibold text-navy mb-4">借款期限</h2>
            <div className="grid grid-cols-4 gap-2">
              {[6, 12, 24, 36, 60, 84, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setValue("loanDurationMonths", m)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all btn-press ${
                    watchDuration === m
                      ? "bg-navy text-white border-navy shadow-elegant"
                      : "bg-white text-foreground border-border hover:border-navy/30"
                  }`}
                >
                  {m} 個月
                </button>
              ))}
            </div>
          </div>

          {/* Purpose */}
          <div className="card-elegant p-6">
            <h2 className="font-display font-semibold text-navy mb-4">借款用途</h2>
            <div className="relative">
              <select
                {...register("purpose")}
                className={`w-full h-10 px-3 pr-10 rounded-lg border bg-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.purpose ? "border-destructive" : "border-input"
                }`}
              >
                <option value="">請選擇借款用途</option>
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.purpose && <p className="text-xs text-destructive mt-1">{errors.purpose.message}</p>}
          </div>

          {/* Repayment Method */}
          <div className="card-elegant p-6">
            <h2 className="font-display font-semibold text-navy mb-4">還款方式</h2>
            <div className="space-y-3">
              {REPAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    watchMethod === m.value
                      ? "border-navy bg-navy/5"
                      : "border-border hover:border-navy/30"
                  }`}
                >
                  <input
                    type="radio"
                    value={m.value}
                    {...register("repaymentMethod")}
                    className="mt-0.5 accent-navy"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Estimate */}
          {monthlyPayment && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/20">
              <Calculator className="w-5 h-5 text-gold-dark flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-navy">預估每月還款金額</p>
                <p className="text-xl font-display font-bold text-gold-dark mt-0.5">
                  NT$ {monthlyPayment.toLocaleString()}
                  {watchMethod === "bullet" && <span className="text-sm font-normal text-muted-foreground ml-1">（利息）</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  以年化利率 8% 試算，實際利率依審核結果而定
                </p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={!canApply || createMutation.isPending}
            className="w-full bg-navy hover:bg-navy-light text-white h-12 text-base btn-press"
          >
            {createMutation.isPending ? "提交中..." : "提交借款申請"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
