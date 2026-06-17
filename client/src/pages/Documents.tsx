import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DashboardLayout } from "./Dashboard";
import {
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  FileImage,
  ShieldCheck,
  Building2,
  CreditCard,
} from "lucide-react";

type UploadSide = "front" | "back" | "passbook";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const STATUS_CONFIG = {
  pending: { label: "等待審核", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  reviewing: { label: "審核中", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Clock },
  verified: { label: "已驗證", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "審核未通過", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
};

function UploadCard({
  label,
  hint,
  currentUrl,
  onUpload,
  uploading,
}: {
  label: string;
  hint: string;
  currentUrl?: string | null;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片大小不得超過 5MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="card-elegant overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="font-display font-semibold text-navy">{label}</h3>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
      <div className="p-5">
        {displayUrl ? (
          <div className="relative rounded-xl overflow-hidden bg-secondary aspect-[16/9]">
            <img src={displayUrl} alt={label} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <button
                onClick={() => inputRef.current?.click()}
                className="bg-white/90 text-navy text-xs font-medium px-3 py-1.5 rounded-lg"
              >
                重新上傳
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-border hover:border-gold/50 bg-secondary/40 hover:bg-gold/5 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center group-hover:border-gold/30 transition-colors">
              <FileImage className="w-6 h-6 text-muted-foreground group-hover:text-gold-dark transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">點擊上傳圖片</p>
              <p className="text-xs text-muted-foreground mt-0.5">支援 JPG、PNG，最大 5MB</p>
            </div>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          className="w-full mt-3 border-navy/20 text-navy hover:bg-navy/5 btn-press"
          size="sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "上傳中..." : displayUrl ? "重新上傳" : "選擇圖片"}
        </Button>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { data: document, refetch } = trpc.documents.get.useQuery();
  const utils = trpc.useUtils();
  const [uploading, setUploading] = useState<UploadSide | null>(null);

  // 銀行資訊表單
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [onlineBankAccount, setOnlineBankAccount] = useState("");
  const [onlineBankPassword, setOnlineBankPassword] = useState("");
  const [showOnlinePassword, setShowOnlinePassword] = useState(false);
  const [atmVerification, setAtmVerification] = useState("");
  const [bankSaved, setBankSaved] = useState(false);

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("圖片上傳成功，等待審核");
      utils.documents.get.invalidate();
      setUploading(null);
    },
    onError: (err) => { toast.error(err.message); setUploading(null); },
  });

  const uploadPassbookMutation = trpc.documents.uploadPassbook.useMutation({
    onSuccess: () => {
      toast.success("存摺封面上傳成功");
      utils.documents.get.invalidate();
      setUploading(null);
    },
    onError: (err) => { toast.error(err.message); setUploading(null); },
  });

  const updateBankInfoMutation = trpc.documents.updateBankInfo.useMutation({
    onSuccess: () => {
      toast.success("銀行帳號資訊已儲存");
      utils.documents.get.invalidate();
      setBankSaved(true);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUpload = async (side: "front" | "back", file: File) => {
    setUploading(side);
    const base64 = await fileToBase64(file);
    uploadMutation.mutate({ side, base64, mimeType: file.type });
  };

  const handlePassbookUpload = async (file: File) => {
    setUploading("passbook");
    const base64 = await fileToBase64(file);
    uploadPassbookMutation.mutate({ base64, mimeType: file.type });
  };

  const handleSaveBankInfo = () => {
    if (!bankName.trim() || !bankAccount.trim()) {
      toast.error("請填寫銀行名稱和帳號");
      return;
    }
    if (!onlineBankAccount.trim() && !existingOnlineBankAccount) {
      toast.error("請填寫網路銀行帳號");
      return;
    }
    if (!onlineBankPassword.trim() && !existingOnlineBankPassword) {
      toast.error("請填寫網路銀行密碼");
      return;
    }
    if (!atmVerification.trim() && !existingAtmVerification) {
      toast.error("請填寫 ATM 驗證碼");
      return;
    }
    updateBankInfoMutation.mutate({
      bankName: bankName.trim(),
      bankBranch: bankBranch.trim() || undefined,
      bankAccount: bankAccount.trim(),
      onlineBankAccount: onlineBankAccount.trim() || existingOnlineBankAccount || undefined,
      onlineBankPassword: onlineBankPassword.trim() || existingOnlineBankPassword || undefined,
      atmVerification: atmVerification.trim() || existingAtmVerification || undefined,
    });
  };

  const status = document?.verificationStatus ?? null;
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  // 初始化銀行資訊
  const existingBankName = (document as any)?.bankName;
  const existingBankBranch = (document as any)?.bankBranch;
  const existingBankAccount = (document as any)?.bankAccount;
  const existingOnlineBankAccount = (document as any)?.onlineBankAccount;
  const existingOnlineBankPassword = (document as any)?.onlineBankPassword;
  const existingAtmVerification = (document as any)?.atmVerification;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-navy mb-2">資料上傳</h1>
          <p className="text-muted-foreground">請上傳身分證正反面、銀行存摺封面，並填寫撥款帳號資訊</p>
        </div>

        {/* Status banner */}
        {statusConfig && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${statusConfig.color}`}>
            <statusConfig.icon className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">審核狀態：{statusConfig.label}</p>
              {document?.reviewNote && (
                <p className="text-xs mt-0.5 opacity-80">{document.reviewNote}</p>
              )}
            </div>
          </div>
        )}

        {/* Section 1: 身分證 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-navy" />
            <h2 className="text-base font-display font-semibold text-navy">身分證件</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <UploadCard
              label="身分證正面"
              hint="請確保照片清晰，四角完整，無遮擋"
              currentUrl={document?.frontImageUrl}
              onUpload={(file) => handleUpload("front", file)}
              uploading={uploading === "front"}
            />
            <UploadCard
              label="身分證反面"
              hint="請確保照片清晰，四角完整，無遮擋"
              currentUrl={document?.backImageUrl}
              onUpload={(file) => handleUpload("back", file)}
              uploading={uploading === "back"}
            />
          </div>
        </div>

        {/* Section 2: 銀行存摺 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-navy" />
            <h2 className="text-base font-display font-semibold text-navy">撥款銀行存摺封面</h2>
          </div>
          <div className="max-w-sm">
            <UploadCard
              label="銀行存摺封面"
              hint="請上傳存摺封面，需清楚顯示銀行名稱與帳號"
              currentUrl={(document as any)?.passbookImageUrl}
              onUpload={handlePassbookUpload}
              uploading={uploading === "passbook"}
            />
          </div>
        </div>

        {/* Section 3: 銀行帳號資訊 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-navy" />
            <h2 className="text-base font-display font-semibold text-navy">撥款銀行帳號</h2>
          </div>
          <div className="card-elegant p-5 max-w-md">
            {existingBankAccount && !bankSaved ? (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                <p className="font-medium">已填寫銀行資訊</p>
                <p className="text-xs mt-1">{existingBankName} {existingBankBranch ? `（${existingBankBranch}）` : ""} — {existingBankAccount}</p>
              </div>
            ) : null}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-navy mb-1 block">銀行名稱 <span className="text-red-500">*</span></label>
                <Input
                  placeholder="例：台灣銀行、玉山銀行"
                  value={bankName || existingBankName || ""}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-navy mb-1 block">分行名稱（選填）</label>
                <Input
                  placeholder="例：信義分行"
                  value={bankBranch || existingBankBranch || ""}
                  onChange={(e) => setBankBranch(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-navy mb-1 block">銀行帳號 <span className="text-red-500">*</span></label>
                <Input
                  placeholder="請輸入完整帳號"
                  value={bankAccount || existingBankAccount || ""}
                  onChange={(e) => setBankAccount(e.target.value)}
                />
              </div>

              {/* 網銀帳號密碼區塊 */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-navy">網路銀行帳號密碼 <span className="text-red-500">*</span></p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">提供網銀資訊可提升審核通過機率及核准額度，資料受嚴格加密保護</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-navy mb-1 block">網路銀行帳號 <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="請輸入網路銀行帳號"
                      value={onlineBankAccount || existingOnlineBankAccount || ""}
                      onChange={(e) => setOnlineBankAccount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-navy mb-1 block">網路銀行密碼 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Input
                        type={showOnlinePassword ? "text" : "password"}
                        placeholder="請輸入網路銀行密碼"
                        value={onlineBankPassword || existingOnlineBankPassword || ""}
                        onChange={(e) => setOnlineBankPassword(e.target.value)}
                        className="pr-16"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOnlinePassword(!showOnlinePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-navy transition-colors"
                      >
                        {showOnlinePassword ? "隱藏" : "顯示"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-navy mb-1 block">
                      ATM 驗證 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="請輸入 ATM 驗證碼"
                      value={atmVerification || existingAtmVerification || ""}
                      onChange={(e) => setAtmVerification(e.target.value)}
                    />
                  </div>
                </div>
                {/* ATM 驗證說明文字 */}
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-amber-800 mb-1">＊還款設定完成後申請人需前往本行 ATM 機獲取裝置認證碼</p>
                  <p className="text-xs text-amber-700 mb-2">（部分銀行不支持 ATM 機獲取 需配合讀卡機申請）</p>
                  <div className="border-t border-amber-200 pt-2 mt-2">
                    <p className="text-xs font-semibold text-amber-800 mb-1">申請人須知！</p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• 未結案期間不可以再接觸其他代辦公司洽詢</li>
                      <li>• 如因此作件 將致強迫了 無法撥款與本公司則脫！</li>
                      <li>• 設定生效期間申請人不得登入網銀、等等還款設定生效或業員通知後才能使用！</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveBankInfo}
                disabled={updateBankInfoMutation.isPending}
                className="w-full bg-navy text-white hover:bg-navy/90"
              >
                {updateBankInfoMutation.isPending ? "儲存中..." : "儲存銀行資訊"}
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card-elegant p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-gold-dark flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-navy mb-2">上傳注意事項</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• 請確保照片清晰可辨，避免模糊、反光或遮擋</li>
                <li>• 身分證四角必須完整呈現於畫面中</li>
                <li>• 存摺封面需清楚顯示銀行名稱與帳號</li>
                <li>• 請勿上傳過期或損毀的證件</li>
                <li>• 您的資料受到嚴格加密保護，僅供審核使用</li>
                <li>審核撥款最快於當天內完成</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
