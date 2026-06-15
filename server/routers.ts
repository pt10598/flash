import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import type { InsertIdDocument } from "../drizzle/schema";
import {
  upsertUser,
  getUserByOpenId,
  getAllUsers,
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
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
          profileCompleted: "complete",
        });
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
        return { success: true, url };
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
        loanDurationMonths: z.number().int().min(1).max(60),
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

        // 通知管理員
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
      const [users, loans] = await Promise.all([
        getAllUsers(),
        getLoanStats(),
      ]);
      return {
        totalUsers: users.length,
        ...loans,
      };
    }),

    users: adminProcedure.query(async () => {
      const allUsers = await getAllUsers();
      const profiles = await Promise.all(allUsers.map(u => getUserProfile(u.id)));
      const docs = await Promise.all(allUsers.map(u => getIdDocument(u.id)));
      return allUsers.map((u, i) => ({
        ...u,
        profile: profiles[i] ?? null,
        document: docs[i] ?? null,
      }));
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
        return { user, profile, document, loans };
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
      }))
      .mutation(async ({ ctx, input }) => {
        await updateLoanApplicationStatus(
          input.loanId,
          input.status,
          ctx.user.id,
          input.adminNote,
          input.interestRate
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
  }),
});

export type AppRouter = typeof appRouter;
