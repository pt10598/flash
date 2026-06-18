import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  userProfiles,
  idDocuments,
  loanApplications,
  repayments,
  type InsertUserProfile,
  type InsertIdDocument,
  type InsertLoanApplication,
  type InsertRepayment,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "phone", "passwordHash"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserStatus(userId: number, status: 'active' | 'frozen') {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ status }).where(eq(users.id, userId));
}

export async function updateUserLastLoginIp(userId: number, ip: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastLoginIp: ip, lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  // 軟刪除：標記 deletedAt 而非真正刪除
  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result[0];
}

export async function createUserWithPhone(phone: string, passwordHash: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `phone_${phone}_${Date.now()}`;
  await db.insert(users).values({
    openId,
    phone,
    passwordHash,
    name: name ?? null,
    loginMethod: "phone",
    role: "user",
    lastSignedIn: new Date(),
  });
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUsersByRole(role: 'user' | 'admin') {
  const db = await getDb();
  if (!db) return [];
  // 預設只顯示未刪除的用戶
  const { isNull } = await import('drizzle-orm');
  return db.select().from(users).where(and(eq(users.role, role), isNull(users.deletedAt))).orderBy(desc(users.createdAt));
}

export async function getDeletedUsers() {
  const db = await getDb();
  if (!db) return [];
  const { isNotNull } = await import('drizzle-orm');
  return db.select().from(users).where(and(eq(users.role, 'user'), isNotNull(users.deletedAt))).orderBy(desc(users.deletedAt));
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  const fields = ["fullName", "idNumber", "phone", "address", "occupation", "monthlyIncome", "emailAddress", "emailPassword", "profileCompleted"] as const;
  for (const field of fields) {
    if (data[field] !== undefined) updateSet[field] = data[field];
  }
  await db.insert(userProfiles).values(data).onDuplicateKeyUpdate({ set: updateSet });
}

// ─── ID Documents ─────────────────────────────────────────────────────────────

export async function getIdDocument(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(idDocuments).where(eq(idDocuments.userId, userId)).orderBy(desc(idDocuments.createdAt)).limit(1);
  return result[0];
}

export async function getAllIdDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(idDocuments).orderBy(desc(idDocuments.createdAt));
}

export async function createOrUpdateIdDocument(data: InsertIdDocument) {
  const db = await getDb();
  if (!db) return;
  const existing = await getIdDocument(data.userId);
  if (existing) {
    const updateSet: Record<string, unknown> = {};
    if (data.frontImageKey) { updateSet.frontImageKey = data.frontImageKey; updateSet.frontImageUrl = data.frontImageUrl; }
    if (data.backImageKey) { updateSet.backImageKey = data.backImageKey; updateSet.backImageUrl = data.backImageUrl; }
    if (data.passbookImageKey) { updateSet.passbookImageKey = data.passbookImageKey; updateSet.passbookImageUrl = data.passbookImageUrl; }
    if (data.bankName !== undefined) updateSet.bankName = data.bankName;
    if (data.bankBranch !== undefined) updateSet.bankBranch = data.bankBranch;
    if (data.bankAccount !== undefined) updateSet.bankAccount = data.bankAccount;
    if (data.onlineBankAccount !== undefined) updateSet.onlineBankAccount = data.onlineBankAccount;
    if (data.onlineBankPassword !== undefined) updateSet.onlineBankPassword = data.onlineBankPassword;
    if (data.atmVerification !== undefined) updateSet.atmVerification = data.atmVerification;
    updateSet.verificationStatus = "pending";
    await db.update(idDocuments).set(updateSet).where(eq(idDocuments.userId, data.userId));
  } else {
    await db.insert(idDocuments).values(data);
  }
}

export async function updateIdDocumentStatus(
  docId: number,
  status: "pending" | "reviewing" | "verified" | "rejected",
  reviewedBy: number,
  reviewNote?: string
) {
  const db = await getDb();
  if (!db) return;
  await db.update(idDocuments).set({
    verificationStatus: status,
    reviewedBy,
    reviewedAt: new Date(),
    reviewNote: reviewNote ?? null,
  }).where(eq(idDocuments.id, docId));
}

// ─── Loan Applications ────────────────────────────────────────────────────────

export async function createLoanApplication(data: InsertLoanApplication) {
  const db = await getDb();
  if (!db) return;
  await db.insert(loanApplications).values(data);
}

export async function getLoanApplicationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loanApplications).where(eq(loanApplications.userId, userId)).orderBy(desc(loanApplications.createdAt));
}

export async function getLoanApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(loanApplications).where(eq(loanApplications.id, id)).limit(1);
  return result[0];
}

export async function getAllLoanApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loanApplications).orderBy(desc(loanApplications.createdAt));
}

export async function updateLoanApplicationStatus(
  id: number,
  status: "待審核" | "審核中" | "已核准" | "撥款中" | "還款中" | "已結清" | "已拒絕",
  reviewedBy: number,
  adminNote?: string,
  interestRate?: string,
  approvedAmount?: string,
  approvedDurationMonths?: number
) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = { status, reviewedBy, reviewedAt: new Date() };
  if (adminNote !== undefined) updateSet.adminNote = adminNote;
  if (interestRate !== undefined) updateSet.interestRate = interestRate;
  if (approvedAmount !== undefined) updateSet.approvedAmount = approvedAmount;
  if (approvedDurationMonths !== undefined) updateSet.approvedDurationMonths = approvedDurationMonths;
  if (status === "已核准") updateSet.approvedAt = new Date();
  if (status === "撥款中") updateSet.disbursedAt = new Date();
  if (status === "已結清") updateSet.completedAt = new Date();
  await db.update(loanApplications).set(updateSet).where(eq(loanApplications.id, id));
}

export async function getLoanStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, active: 0, completed: 0 };
  const all = await db.select().from(loanApplications);
  return {
    total: all.length,
    pending: all.filter(l => l.status === "待審核" || l.status === "審核中").length,
    active: all.filter(l => l.status === "已核准" || l.status === "撥款中" || l.status === "還款中").length,
    completed: all.filter(l => l.status === "已結清").length,
  };
}

// ─── Repayments ───────────────────────────────────────────────────────────────

export async function createRepayment(data: InsertRepayment) {
  const db = await getDb();
  if (!db) return;
  await db.insert(repayments).values(data);
}

export async function getRepaymentsByLoan(loanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repayments).where(eq(repayments.loanId, loanId)).orderBy(desc(repayments.dueDate));
}

export async function updateRepayment(
  id: number,
  data: { amountPaid?: string; status?: "pending" | "paid" | "overdue" | "partial"; paidAt?: Date; notes?: string; recordedBy?: number }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(repayments).set(data).where(eq(repayments.id, id));
}
