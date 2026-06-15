import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DashboardLayout } from "./Dashboard";
import {
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileImage,
  ShieldCheck,
} from "lucide-react";

type Side = "front" | "back";

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
  side,
  label,
  hint,
  currentUrl,
  onUpload,
  uploading,
}: {
  side: Side;
  label: string;
  hint: string;
  currentUrl?: string | null;
  onUpload: (side: Side, file: File) => void;
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
    onUpload(side, file);
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
            <img
              src={displayUrl}
              alt={label}
              className="w-full h-full object-contain"
            />
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

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

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
  const [uploading, setUploading] = useState<Side | null>(null);

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("圖片上傳成功，等待審核");
      utils.documents.get.invalidate();
      setUploading(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setUploading(null);
    },
  });

  const handleUpload = async (side: Side, file: File) => {
    setUploading(side);
    const base64 = await fileToBase64(file);
    uploadMutation.mutate({ side, base64, mimeType: file.type });
  };

  const status = document?.verificationStatus ?? null;
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  const bothUploaded = !!(document?.frontImageUrl && document?.backImageUrl);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-navy mb-2">身份證件上傳</h1>
          <p className="text-muted-foreground">請上傳您的身分證正面與反面，以完成身份驗證</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <UploadCard
            side="front"
            label="身分證正面"
            hint="請確保照片清晰，四角完整，無遮擋"
            currentUrl={document?.frontImageUrl}
            onUpload={handleUpload}
            uploading={uploading === "front"}
          />
          <UploadCard
            side="back"
            label="身分證反面"
            hint="請確保照片清晰，四角完整，無遮擋"
            currentUrl={document?.backImageUrl}
            onUpload={handleUpload}
            uploading={uploading === "back"}
          />
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
                <li>• 請勿上傳過期或損毀的證件</li>
                <li>• 您的證件資料受到嚴格加密保護，僅供身份驗證使用</li>
                <li>• 審核通常於 1-2 個工作天內完成</li>
              </ul>
            </div>
          </div>
        </div>

        {bothUploaded && !statusConfig && (
          <div className="mt-4 flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="w-4 h-4" />
            雙證件已上傳完成，等待審核人員確認
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
