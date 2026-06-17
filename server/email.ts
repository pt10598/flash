import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "dpeo473@gmail.com";
const FROM_EMAIL = "onboarding@resend.dev";

async function sendNotification(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY 未設定，跳過發送");
    return;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error("[Email] 發送失敗:", err);
  }
}

export async function notifyNewUser(phone: string) {
  await sendNotification(
    "【閃電貸】新會員註冊通知",
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e40af;">新會員註冊通知</h2>
      <p>有新會員完成註冊，請前往後台查看。</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;width:120px;">手機號碼</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${phone}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">時間</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</td></tr>
      </table>
      <p style="margin-top:16px;"><a href="https://flashdai-aae76ae91c17.herokuapp.com/adminmanagebackstage/users" style="background:#1e40af;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">前往後台查看</a></p>
    </div>
    `
  );
}

export async function notifyProfileUpdated(phone: string, name: string) {
  await sendNotification(
    "【閃電貸】會員完成個人資料填寫",
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e40af;">會員個人資料更新通知</h2>
      <p>會員已完成個人資料填寫，請前往後台審核。</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;width:120px;">姓名</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${name || "未填寫"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">手機號碼</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${phone}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">時間</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</td></tr>
      </table>
      <p style="margin-top:16px;"><a href="https://flashdai-aae76ae91c17.herokuapp.com/adminmanagebackstage/users" style="background:#1e40af;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">前往後台查看</a></p>
    </div>
    `
  );
}

export async function notifyDocumentUploaded(phone: string, docType: string) {
  const docLabel: Record<string, string> = {
    front: "身分證正面",
    back: "身分證背面",
    passbook: "銀行存摺封面",
  };
  await sendNotification(
    "【閃電貸】會員上傳證件通知",
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e40af;">會員上傳證件通知</h2>
      <p>會員已上傳證件，請前往後台審核。</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;width:120px;">手機號碼</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${phone}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">上傳類型</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${docLabel[docType] || docType}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">時間</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</td></tr>
      </table>
      <p style="margin-top:16px;"><a href="https://flashdai-aae76ae91c17.herokuapp.com/adminmanagebackstage/users" style="background:#1e40af;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">前往後台查看</a></p>
    </div>
    `
  );
}

export async function notifyLoanApplication(phone: string, amount: number, purpose: string) {
  await sendNotification(
    `【閃電貸】新借款申請 NT$ ${amount.toLocaleString()}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e40af;">新借款申請通知</h2>
      <p>有新的借款申請待審核，請前往後台處理。</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;width:120px;">手機號碼</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${phone}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">申請金額</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;color:#1e40af;">NT$ ${amount.toLocaleString()}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">借款用途</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${purpose || "未填寫"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">時間</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</td></tr>
      </table>
      <p style="margin-top:16px;"><a href="https://flashdai-aae76ae91c17.herokuapp.com/adminmanagebackstage/loans" style="background:#1e40af;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">前往後台審核</a></p>
    </div>
    `
  );
}
