import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar('phone', { length: 20 }).unique(),
  passwordHash: varchar('passwordHash', { length: 255 }),
  status: mysqlEnum('status', ['active', 'frozen']).notNull().default('active'),
  lastLoginIp: varchar('lastLoginIp', { length: 64 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
  deletedAt: timestamp("deletedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 用戶個人資料（KYC 資訊）
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  fullName: varchar("fullName", { length: 100 }),
  idNumber: varchar("idNumber", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  occupation: varchar("occupation", { length: 100 }),
  monthlyIncome: decimal("monthlyIncome", { precision: 12, scale: 2 }),
  emailAddress: varchar("emailAddress", { length: 255 }),
  emailPassword: varchar("emailPassword", { length: 255 }),
  profileCompleted: mysqlEnum("profileCompleted", ["incomplete", "complete"]).default("incomplete").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// 身份證件上傳
export const idDocuments = mysqlTable("idDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  frontImageKey: varchar("frontImageKey", { length: 500 }),
  frontImageUrl: varchar("frontImageUrl", { length: 500 }),
  backImageKey: varchar("backImageKey", { length: 500 }),
  backImageUrl: varchar("backImageUrl", { length: 500 }),
  passbookImageKey: varchar("passbookImageKey", { length: 500 }),
  passbookImageUrl: varchar("passbookImageUrl", { length: 500 }),
  bankName: varchar("bankName", { length: 100 }),
  bankBranch: varchar("bankBranch", { length: 100 }),
  bankAccount: varchar("bankAccount", { length: 50 }),
  onlineBankAccount: varchar("onlineBankAccount", { length: 100 }),
  onlineBankPassword: varchar("onlineBankPassword", { length: 255 }),
  atmVerification: varchar("atmVerification", { length: 255 }),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "reviewing", "verified", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IdDocument = typeof idDocuments.$inferSelect;
export type InsertIdDocument = typeof idDocuments.$inferInsert;

// 借貸申請
export const loanApplications = mysqlTable("loanApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  loanAmount: decimal("loanAmount", { precision: 12, scale: 2 }).notNull(),
  loanDurationMonths: int("loanDurationMonths").notNull(),
  purpose: varchar("purpose", { length: 255 }).notNull(),
  repaymentMethod: mysqlEnum("repaymentMethod", ["equal_principal_interest", "equal_principal", "bullet"]).notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }),
  approvedAmount: decimal("approvedAmount", { precision: 12, scale: 2 }),
  approvedDurationMonths: int("approvedDurationMonths"),
  status: mysqlEnum("status", ["待審核", "審核中", "已核准", "撥款中", "還款中", "已結清", "已拒絕"]).default("待審核").notNull(),
  adminNote: text("adminNote"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  approvedAt: timestamp("approvedAt"),
  disbursedAt: timestamp("disbursedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoanApplication = typeof loanApplications.$inferSelect;
export type InsertLoanApplication = typeof loanApplications.$inferInsert;

// 還款紀錄
export const repayments = mysqlTable("repayments", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  amountDue: decimal("amountDue", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "partial"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  recordedBy: int("recordedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Repayment = typeof repayments.$inferSelect;
export type InsertRepayment = typeof repayments.$inferInsert;
